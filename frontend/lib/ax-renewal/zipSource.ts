/**
 * Packs a picked folder's files into one zip archive, in the browser, so the
 * project's source can be uploaded as a single file (ADR-118).
 *
 * Stored, not compressed: the point is one file the backend can keep under
 * one name, and a stored zip needs nothing but a CRC per file — no new
 * dependency for the sake of a smaller upload. Dependency trees, build output
 * and version-control folders are left out, by the same rule the Attach
 * step's own counts use (`isSkippedPath`).
 *
 * // req: ADR-118
 */
import { isSkippedPath } from "@/lib/ax-renewal/attachStats";

/** Matches `AxRenewalSourceStorage.MAX_BYTES` on the backend — checked here first so nobody waits for an upload that will be refused. */
export const MAX_SOURCE_ZIP_BYTES = 200 * 1024 * 1024;

/** The classic zip format counts entries in 16 bits. */
const MAX_ENTRIES = 0xffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pathOf(file: File): string {
  return file.webkitRelativePath || file.name;
}

export class SourceTooLargeError extends Error {}

/**
 * Builds the archive. Entry names are the files' paths relative to what was
 * picked (root folder name included), with forward slashes, flagged UTF-8 so
 * Korean and Khmer file names survive.
 *
 * Throws `SourceTooLargeError` when the project will not fit; an unreadable
 * file is skipped rather than failing the whole upload, the same choice the
 * secrets scan makes.
 */
export async function zipSource(files: FileList | File[]): Promise<Blob> {
  const list = Array.from(files).filter((f) => !isSkippedPath(pathOf(f)));
  if (list.length > MAX_ENTRIES) {
    throw new SourceTooLargeError(
      `This project has ${list.length.toLocaleString()} files — more than one upload can hold (${MAX_ENTRIES.toLocaleString()}).`,
    );
  }
  const totalBytes = list.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_SOURCE_ZIP_BYTES) {
    throw new SourceTooLargeError("This project's source is larger than 200 MB, so it was not uploaded.");
  }

  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  let count = 0;

  for (const file of list) {
    let data: Uint8Array;
    try {
      data = new Uint8Array(await file.arrayBuffer());
    } catch {
      continue;
    }
    const name = encoder.encode(pathOf(file).replace(/\\/g, "/"));
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, 0, true); // time
    local.setUint16(12, 0x21, true); // date: 1980-01-01
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true); // version made by
    entry.setUint16(6, 20, true); // version needed
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint16(12, 0, true);
    entry.setUint16(14, 0x21, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true); // extra, comment, disk and attributes stay zero
    central.push(new Uint8Array(entry.buffer), name);

    parts.push(local.buffer, name, data);
    offset += 30 + name.length + data.length;
    count++;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, count, true);
  end.setUint16(10, count, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

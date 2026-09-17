/**
 * A minimal ZIP writer — enough to build the one container format we need.
 *
 * An .xlsx file is a ZIP of XML parts, so producing a spreadsheet needs a ZIP
 * writer and nothing else. This is that writer and no more: no reading, no
 * directories, no encryption, no ZIP64.
 *
 * **Entries are STORED, never deflated.** Compression would mean pulling in a
 * deflate implementation or depending on `CompressionStream`, which is async
 * and not in every browser this app supports. A user-list export is tens of
 * kilobytes of XML; the file being three times smaller is worth less than the
 * code being readable and synchronous. Excel, LibreOffice and Google Sheets
 * all open stored entries — it is a normal ZIP, just not a squeezed one.
 *
 * Deliberately no dependency. `xlsx` on npm carries known CVEs and `exceljs`
 * is about a megabyte for one button, and either would be a stack decision
 * needing an ADR (HARNESS-PROCESS-STANDARD §5.2). This is smaller than that
 * conversation.
 */

/** One file to put in the archive. */
export interface ZipEntry {
  /** Path inside the archive, `/`-separated, no leading slash. */
  name: string;
  data: Uint8Array;
}

/**
 * CRC-32, the checksum every ZIP entry carries.
 *
 * <p>The table is built once on first use rather than written out as 256
 * literals: it is cheaper to read, and cheaper to be confident is right.
 */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      // 0xEDB88320 is the reversed polynomial; the whole of CRC-32 is this line.
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  // Iterated by value rather than by index: `noUncheckedIndexedAccess` types
  // `data[i]` as possibly undefined, and `for..of` over a typed array gives a
  // plain number with nothing to assert past.
  for (const byte of data) {
    // Masked to a byte, so the lookup is always within the 256-entry table.
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Grows as it is written to; the archive's length is not known up front. */
class ByteSink {
  private parts: Uint8Array[] = [];
  private length = 0;

  /** How many bytes have been written — the offset a header needs to record. */
  get offset(): number {
    return this.length;
  }

  bytes(data: Uint8Array): void {
    this.parts.push(data);
    this.length += data.length;
  }

  /** Little-endian, which is the only byte order in a ZIP. */
  u16(value: number): void {
    this.bytes(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  u32(value: number): void {
    this.bytes(
      new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]),
    );
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let at = 0;
    for (const part of this.parts) {
      out.set(part, at);
      at += part.length;
    }
    return out;
  }
}

/** Version 2.0 — the floor for a stored entry, and what every reader accepts. */
const VERSION = 20;

/**
 * Bit 11 of the general-purpose flags: the file name is UTF-8.
 *
 * Set unconditionally. Without it a reader is entitled to decode names as
 * CP437, and while the names this writer produces are all ASCII today, a
 * non-ASCII one appearing later would break silently and in a way nobody
 * would connect to this line.
 */
const FLAG_UTF8 = 0x0800;

/**
 * Packs entries into a ZIP archive.
 *
 * <p>Modification times are written as zero rather than "now". A build that
 * produces byte-identical output for identical input is easier to test and to
 * compare, and a spreadsheet's own metadata already records when it was made.
 * Readers show the epoch as the entry date, which nobody looks at.
 */
export function zip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const sink = new ByteSink();
  const central: { name: Uint8Array; crc: number; size: number; offset: number }[] = [];

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const offset = sink.offset;

    sink.u32(0x04034b50); // local file header
    sink.u16(VERSION);
    sink.u16(FLAG_UTF8);
    sink.u16(0); // method: stored
    sink.u16(0); // modification time
    sink.u16(0); // modification date
    sink.u32(crc);
    sink.u32(entry.data.length); // compressed size == uncompressed, stored
    sink.u32(entry.data.length);
    sink.u16(name.length);
    sink.u16(0); // extra field length
    sink.bytes(name);
    sink.bytes(entry.data);

    central.push({ name, crc, size: entry.data.length, offset });
  }

  const centralStart = sink.offset;
  for (const entry of central) {
    sink.u32(0x02014b50); // central directory header
    sink.u16(VERSION); // version made by
    sink.u16(VERSION); // version needed
    sink.u16(FLAG_UTF8);
    sink.u16(0); // method
    sink.u16(0); // time
    sink.u16(0); // date
    sink.u32(entry.crc);
    sink.u32(entry.size);
    sink.u32(entry.size);
    sink.u16(entry.name.length);
    sink.u16(0); // extra
    sink.u16(0); // comment
    sink.u16(0); // disk number
    sink.u16(0); // internal attributes
    sink.u32(0); // external attributes
    sink.u32(entry.offset);
    sink.bytes(entry.name);
  }
  const centralSize = sink.offset - centralStart;

  sink.u32(0x06054b50); // end of central directory
  sink.u16(0); // this disk
  sink.u16(0); // disk with the central directory
  sink.u16(central.length);
  sink.u16(central.length);
  sink.u32(centralSize);
  sink.u32(centralStart);
  sink.u16(0); // comment length

  return sink.concat();
}

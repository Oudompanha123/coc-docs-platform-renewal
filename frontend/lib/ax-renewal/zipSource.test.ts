import { describe, expect, it } from "vitest";
import { zipSource } from "@/lib/ax-renewal/zipSource";

function file(path: string, text: string): File {
  const f = new File([text], path.split("/").pop()!);
  Object.defineProperty(f, "webkitRelativePath", { value: path });
  return f;
}

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe("zipSource", () => {
  it("writes a stored zip whose entries are the project's own files", async () => {
    const zip = await zipSource([
      file("app/src/index.js", "console.log(1)"),
      file("app/node_modules/x/index.js", "skipped"),
      file("app/ខ្មែរ.txt", "hello"),
    ]);
    const bytes = await bytesOf(zip);
    const view = new DataView(bytes.buffer);

    expect(view.getUint32(0, true)).toBe(0x04034b50);
    // End record: two entries — the dependency tree was left out.
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);

    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("app/src/index.js");
    expect(text).toContain("app/ខ្មែរ.txt");
    expect(text).not.toContain("node_modules");
    // CRC-32 of "hello".
    const central = view.getUint32(end + 16, true);
    const secondEntry = central + 46 + "app/src/index.js".length;
    expect(view.getUint32(secondEntry + 16, true)).toBe(0x3610a686);
  });

  it("refuses a project that is too large to upload", async () => {
    const big = file("app/big.bin", "");
    Object.defineProperty(big, "size", { value: 300 * 1024 * 1024 });
    await expect(zipSource([big])).rejects.toThrow(/200 MB/);
  });
});

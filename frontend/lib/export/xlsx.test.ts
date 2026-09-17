import { describe, expect, it } from "vitest";
import { crc32, zip } from "./zip";
import { buildXlsx, columnName, escapeXml, excelSerial, safeSheetName } from "./xlsx";

/** A view over the archive, for reading the little-endian fields ZIP uses. */
function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function u32(bytes: Uint8Array, at: number): number {
  return view(bytes).getUint32(at, true);
}

function u16(bytes: Uint8Array, at: number): number {
  return view(bytes).getUint16(at, true);
}

function text(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

describe("crc32", () => {
  /**
   * The check value from the CRC-32 specification. If the table or the
   * polynomial were wrong this is the one assertion that would say so — a
   * corrupt checksum makes an archive that unzips fine on a lenient reader and
   * is rejected by Excel, which is the worst way to find out.
   */
  it("matches the standard check value for \"123456789\"", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("is zero for no bytes", () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe("zip", () => {
  it("writes a recognisable archive with one entry per file", () => {
    const archive = zip([
      { name: "a.txt", data: new TextEncoder().encode("hello") },
      { name: "b/c.txt", data: new TextEncoder().encode("world") },
    ]);

    expect(u32(archive, 0)).toBe(0x04034b50); // first local header

    // End-of-central-directory, last 22 bytes when there is no comment.
    const eocd = archive.length - 22;
    expect(u32(archive, eocd)).toBe(0x06054b50);
    expect(u16(archive, eocd + 10)).toBe(2); // entry count
  });

  it("stores the file names and contents verbatim", () => {
    const archive = zip([{ name: "xl/sheet.xml", data: new TextEncoder().encode("<x/>") }]);
    const whole = text(archive);

    expect(whole).toContain("xl/sheet.xml");
    expect(whole).toContain("<x/>");
  });

  /**
   * Stored, not deflated — the reason the writer needs no compression code at
   * all. Sizes appearing twice and equal is what "stored" looks like on the
   * wire.
   */
  it("records equal compressed and uncompressed sizes", () => {
    const data = new TextEncoder().encode("some bytes here");
    const archive = zip([{ name: "f", data }]);

    expect(u32(archive, 18)).toBe(data.length); // compressed
    expect(u32(archive, 22)).toBe(data.length); // uncompressed
  });

  it("produces identical bytes for identical input", () => {
    const entry = () => [{ name: "f", data: new TextEncoder().encode("x") }];
    expect(Array.from(zip(entry()))).toEqual(Array.from(zip(entry())));
  });
});

describe("escapeXml", () => {
  it("escapes the five XML characters", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe("a &amp; b &lt; c &gt; d &quot; e &apos; f");
  });

  it("escapes an ampersand once, not twice", () => {
    expect(escapeXml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    expect(escapeXml("&lt;")).toBe("&amp;lt;");
  });

  /**
   * The reason this feature exists at all: a CSV would hand these to Excel
   * under the system codepage and produce mojibake.
   */
  it("passes Khmer, Korean and accented Latin through untouched", () => {
    expect(escapeXml("វត្តមាន")).toBe("វត្តមាន");
    expect(escapeXml("출근")).toBe("출근");
    expect(escapeXml("Søcheat Hun")).toBe("Søcheat Hun");
  });

  it("drops control characters that would make the workbook unopenable", () => {
    expect(escapeXml(`a${String.fromCharCode(0)}b${String.fromCharCode(7)}c`)).toBe("abc");
    expect(escapeXml(`x${String.fromCharCode(0x7f)}y`)).toBe("xy");
  });

  it("keeps tab, newline and carriage return, which XML allows", () => {
    expect(escapeXml("a\tb\nc\rd")).toBe("a\tb\nc\rd");
  });
});

describe("columnName", () => {
  it("counts in base-26 with no zero digit", () => {
    expect(columnName(0)).toBe("A");
    expect(columnName(25)).toBe("Z");
    // The off-by-one every naive implementation gets wrong: after Z comes AA.
    expect(columnName(26)).toBe("AA");
    expect(columnName(27)).toBe("AB");
    expect(columnName(51)).toBe("AZ");
    expect(columnName(52)).toBe("BA");
    expect(columnName(701)).toBe("ZZ");
    expect(columnName(702)).toBe("AAA");
  });
});

describe("excelSerial", () => {
  /**
   * 46282 is what Excel itself shows for this date, and it is the assertion
   * that pins the 25569 epoch constant: 25568 or 25570 — the two ways to get
   * the Lotus leap-year bug wrong — both fail here by exactly one day.
   *
   * Deliberately not asserted against a date in 1900, which is the tempting
   * choice because it sits either side of the fictional 29 February. Before
   * standard time, zones ran on Local Mean Time at offsets that included
   * seconds (Phnom Penh was +06:59:40), and `getTimezoneOffset()` reports only
   * whole minutes — so a 1900 date is a few seconds out through no fault of
   * this function, and the test would fail for a reason that has nothing to do
   * with what it claims to check.
   */
  it("agrees with Excel on a date this actually exports", () => {
    expect(excelSerial(new Date("2026-09-17T00:00:00"))).toBeCloseTo(46282, 6);
  });

  it("advances by exactly one per day", () => {
    const first = excelSerial(new Date("2026-09-17T00:00:00"));
    const second = excelSerial(new Date("2026-09-18T00:00:00"));
    expect(second - first).toBeCloseTo(1, 9);
  });

  it("carries the time of day as the fraction", () => {
    expect(excelSerial(new Date("2026-09-17T06:00:00")) % 1).toBeCloseTo(0.25, 6);
  });
});

describe("safeSheetName", () => {
  it("replaces the characters Excel refuses", () => {
    expect(safeSheetName("Users/Roles")).toBe("Users Roles");
    expect(safeSheetName("a:b\\c?d*e[f]g")).toBe("a b c d e f g");
  });

  it("truncates to Excel's 31-character limit", () => {
    expect(safeSheetName("x".repeat(40))).toHaveLength(31);
  });

  it("falls back rather than producing an empty name", () => {
    expect(safeSheetName("   ")).toBe("Sheet1");
    expect(safeSheetName("[]")).toBe("Sheet1");
  });
});

describe("buildXlsx", () => {
  const sheet = () =>
    buildXlsx({
      sheetName: "Users & Roles",
      headers: ["Name", "Signed in"],
      rows: [
        ["Søcheat Hun", new Date("2026-09-17T08:30:00")],
        ["Tom & Jerry", null],
      ],
    });

  it("contains every part a workbook needs", () => {
    const whole = text(sheet());
    for (const part of [
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/worksheets/sheet1.xml",
    ]) {
      expect(whole).toContain(part);
    }
  });

  it("writes the header and the values", () => {
    const whole = text(sheet());
    expect(whole).toContain("<t>Name</t>");
    expect(whole).toContain("Søcheat Hun");
    expect(whole).toContain("Tom &amp; Jerry");
  });

  it("escapes the sheet name in the workbook part", () => {
    expect(text(sheet())).toContain('name="Users &amp; Roles"');
  });

  it("writes a date as a styled serial, not as text", () => {
    const whole = text(sheet());
    expect(whole).toContain(`s="2"`);
    expect(whole).not.toContain("2026-09-17T08:30");
  });

  it("leaves a blank cell out entirely rather than writing an empty one", () => {
    // Row 3 is the second data row, whose second column is null.
    expect(text(sheet())).not.toContain('r="B3"');
  });

  it("survives a sheet with no rows", () => {
    const whole = text(buildXlsx({ sheetName: "Empty", headers: ["A"], rows: [] }));
    expect(whole).toContain("<t>A</t>");
    expect(whole).toContain('<autoFilter ref="A1:A1"/>');
  });
});

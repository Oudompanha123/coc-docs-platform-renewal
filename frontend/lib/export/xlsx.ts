import { zip, type ZipEntry } from "./zip";

/**
 * Builds a single-sheet .xlsx workbook.
 *
 * <p>Why a real workbook and not a CSV, which would be four lines: this
 * application's data is Khmer, Korean and accented Latin, and Excel on a
 * machine whose system codepage is not UTF-8 — which describes every machine
 * on this project (`CONST-OPS-01`) — reads a UTF-8 CSV as that codepage and
 * renders the names as mojibake. A CSV has no encoding declaration to prevent
 * it. An .xlsx carries UTF-8 XML inside a ZIP, declared, and cannot be misread
 * that way. The reasoning that keeps PowerShell away from this repo's content
 * files applies equally to what it hands people to open.
 *
 * <p>Strings are written inline (`t="inlineStr"`) rather than through a shared
 * string table. A shared table is smaller when values repeat, and it is a
 * second part to keep in step with the sheet; for an export measured in
 * hundreds of rows the saving is not worth the indirection.
 */

/** A cell: text, a number, a date, or nothing. */
export type CellValue = string | number | Date | null | undefined;

export interface SheetData {
  /** The tab's name. Excel refuses some characters here — see {@link safeSheetName}. */
  sheetName: string;
  headers: string[];
  rows: CellValue[][];
  /** Column widths in characters. Missing entries fall back to a readable default. */
  columnWidths?: number[];
  /**
   * 0-based column indices whose data cells (not the header, which is
   * already centred) are horizontally centred rather than left-aligned —
   * for short, fixed-vocabulary columns like a status or a yes/no flag,
   * where left-aligned text reads as ragged against a bordered grid.
   */
  centeredColumns?: number[];
}

/** Style indices, matching the order of `cellXfs` in {@link STYLES_XML}. */
const STYLE_DEFAULT = 0;
const STYLE_HEADER = 1;
const STYLE_DATE = 2;
const STYLE_DEFAULT_CENTER = 3;
const STYLE_DATE_CENTER = 4;

/**
 * Escapes text for XML content.
 *
 * <p>Written as a loop over code points rather than a chain of `replace`
 * calls, because one of the things it has to do is drop characters XML 1.0
 * forbids outright, and expressing those as a regex character class means
 * putting literal control bytes in this source file. A display name pasted out
 * of a terminal should not be able to make the workbook unopenable, and this
 * file should stay something an editor will show you.
 *
 * <p>Tab, newline and carriage return are legal in XML and survive. Every
 * other C0 control, and DEL, is dropped. Quotes are escaped as well as the
 * markup characters, so the result is safe in an attribute value too and there
 * is no second function to use in the wrong place.
 */
export function escapeXml(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;

    if (code < 0x20 && ch !== "\t" && ch !== "\n" && ch !== "\r") continue;
    if (code === 0x7f) continue;

    switch (ch) {
      case "&":
        out += "&amp;";
        break;
      case "<":
        out += "&lt;";
        break;
      case ">":
        out += "&gt;";
        break;
      case '"':
        out += "&quot;";
        break;
      case "'":
        out += "&apos;";
        break;
      default:
        out += ch;
    }
  }
  return out;
}

/**
 * Column letters: 0 to A, 25 to Z, 26 to AA.
 *
 * <p>Base-26 with no zero digit, which is why the loop subtracts one each time
 * round rather than dividing cleanly. Z followed by AA, not by BA, is the
 * thing this gets right and a naive base-26 conversion does not.
 */
export function columnName(index: number): string {
  let name = "";
  let n = index;
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

/**
 * A JavaScript date as an Excel serial number.
 *
 * <p>Excel counts 1899-12-31 as day 1 but also believes 1900 was a leap year —
 * a bug kept deliberately for compatibility with Lotus 1-2-3. The two cancel
 * out for every date after February 1900 if the epoch is taken as 1899-12-30,
 * which is the 25569 below: the days from there to 1970-01-01.
 *
 * <p>The local timezone offset is subtracted because a spreadsheet cell has no
 * timezone. Writing UTC instead would show a reader in Phnom Penh a time seven
 * hours from the one the page showed them; this exports what was on screen.
 */
export function excelSerial(date: Date): number {
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  return localMs / 86_400_000 + 25569;
}

/**
 * A sheet name Excel will accept.
 *
 * <p>Excel rejects the characters below, anything over 31 characters, and an
 * empty name — and it rejects the whole file rather than the name, showing
 * "unreadable content" with no clue which part was at fault.
 */
export function safeSheetName(name: string): string {
  const cleaned = name
    .split("")
    .map((ch) => (":\\/?*[]".includes(ch) ? " " : ch))
    .join("")
    .trim()
    .slice(0, 31);
  return cleaned.length > 0 ? cleaned : "Sheet1";
}

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const CONTENT_TYPES_XML = `${XML_DECLARATION}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `${XML_DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS_XML = `${XML_DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

/**
 * The style table.
 *
 * <p>Three cell formats — plain, the header, and a date format — each now
 * bordered on all four sides (`borderId="1"`), so every cell in the sheet,
 * not only the header, reads as part of a ruled table rather than loose text
 * on a grid Excel would otherwise hide once gridlines are turned off. Excel
 * requires at least two fills, the second being `gray125`, and refuses the
 * file without them — an inherited quirk, not a choice made here; the
 * header's own fill is a third.
 *
 * <p>The header's fill is a two-stop gradient (brand-purple to brand-blue) —
 * the same `from-brand-purple to-brand-blue` treatment this app already uses
 * for its primary buttons and its highest-tier badges — with a bold white
 * font and centred text, so the header reads as designed rather than as a
 * bolded copy of the data rows beneath it.
 *
 * <p>`numFmtId` 164 is the first id available to a document; everything below
 * it is reserved for Excel's built-in formats.
 *
 * <p>Two more formats, {@link STYLE_DEFAULT_CENTER} and
 * {@link STYLE_DATE_CENTER}, mirror the first and third exactly but add
 * `<alignment horizontal="center"/>` — for columns a caller names via
 * {@link SheetData.centeredColumns}, e.g. a short status word or a Yes/No
 * flag, where left-aligned text reads as ragged against a bordered grid.
 */
const STYLES_XML = `${XML_DECLARATION}
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts>
<fonts count="3">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><gradientFill degree="0"><stop position="0"><color rgb="FF6D3CE0"/></stop><stop position="1"><color rgb="FF4C6FF0"/></stop></gradientFill></fill>
</fills>
<borders count="2">
<border/>
<border>
<left style="thin"><color rgb="FFD7DAE3"/></left>
<right style="thin"><color rgb="FFD7DAE3"/></right>
<top style="thin"><color rgb="FFD7DAE3"/></top>
<bottom style="thin"><color rgb="FFD7DAE3"/></bottom>
</border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function workbookXml(sheetName: string): string {
  return `${XML_DECLARATION}
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(safeSheetName(sheetName))}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

/**
 * One `<c>` element — styled even when blank.
 *
 * <p>A blank cell still carries a style rather than being omitted outright:
 * an omitted `<c>` has no border, which would punch a gap in an otherwise
 * fully ruled table exactly where a value happens to be missing (a `null`
 * last-sign-in, an unparseable date). The border is the point of this style
 * table, so every cell keeps it, empty or not.
 *
 * @param centered whether this column is one of {@link SheetData.centeredColumns} —
 *     picks the centred variant of the default/date style rather than a third,
 *     separately-tracked style constant per call site.
 */
function cellXml(ref: string, value: CellValue, centered: boolean): string {
  const defaultStyle = centered ? STYLE_DEFAULT_CENTER : STYLE_DEFAULT;
  const dateStyle = centered ? STYLE_DATE_CENTER : STYLE_DATE;

  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}" s="${defaultStyle}"/>`;
  }
  if (value instanceof Date) {
    // An invalid Date would serialise as NaN and make the whole workbook
    // unreadable, so it degrades to a blank (but still bordered) cell instead.
    if (Number.isNaN(value.getTime())) {
      return `<c r="${ref}" s="${defaultStyle}"/>`;
    }
    return `<c r="${ref}" s="${dateStyle}"><v>${excelSerial(value)}</v></c>`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return `<c r="${ref}" s="${defaultStyle}"/>`;
    }
    return `<c r="${ref}" s="${defaultStyle}"><v>${value}</v></c>`;
  }
  // xml:space="preserve" so a value with meaningful leading or trailing spaces
  // survives; without it a reader is entitled to trim it.
  return `<c r="${ref}" s="${defaultStyle}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml(data: SheetData): string {
  const { headers, rows } = data;

  const widths = headers
    .map((_, i) => `<col min="${i + 1}" max="${i + 1}" width="${data.columnWidths?.[i] ?? 18}" customWidth="1"/>`)
    .join("");

  const headerCells = headers
    .map(
      (header, i) =>
        `<c r="${columnName(i)}1" s="${STYLE_HEADER}" t="inlineStr"><is><t>${escapeXml(header)}</t></is></c>`,
    )
    .join("");

  const centeredColumns = new Set(data.centeredColumns ?? []);

  const bodyRows = rows
    .map((row, r) => {
      const rowNumber = r + 2; // row 1 is the header
      const cells = row
        .map((value, c) => cellXml(`${columnName(c)}${rowNumber}`, value, centeredColumns.has(c)))
        .join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  // The header is frozen and filterable: one attribute each, and the first two
  // things anybody does by hand to a sheet this shape.
  const lastColumn = columnName(Math.max(headers.length - 1, 0));
  return `${XML_DECLARATION}
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${widths}</cols>
<sheetData><row r="1" ht="20" customHeight="1">${headerCells}</row>${bodyRows}</sheetData>
<autoFilter ref="A1:${lastColumn}${rows.length + 1}"/>
</worksheet>`;
}

/** The workbook as bytes. */
export function buildXlsx(data: SheetData): Uint8Array {
  const encoder = new TextEncoder();
  const part = (name: string, xml: string): ZipEntry => ({ name, data: encoder.encode(xml) });

  return zip([
    // [Content_Types].xml first, by convention — some readers expect to meet it
    // before the parts it describes.
    part("[Content_Types].xml", CONTENT_TYPES_XML),
    part("_rels/.rels", ROOT_RELS_XML),
    part("xl/workbook.xml", workbookXml(data.sheetName)),
    part("xl/_rels/workbook.xml.rels", WORKBOOK_RELS_XML),
    part("xl/styles.xml", STYLES_XML),
    part("xl/worksheets/sheet1.xml", sheetXml(data)),
  ]);
}

/** The workbook as a Blob, typed so a browser hands it to a spreadsheet app. */
export function xlsxBlob(data: SheetData): Blob {
  return new Blob([buildXlsx(data) as unknown as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

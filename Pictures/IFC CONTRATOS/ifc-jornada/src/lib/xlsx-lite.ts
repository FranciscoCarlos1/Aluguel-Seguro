import { inflateRawSync } from "node:zlib";

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function readUInt32(buffer: Buffer, offset: number) {
  return buffer.readUInt32LE(offset);
}

function readUInt16(buffer: Buffer, offset: number) {
  return buffer.readUInt16LE(offset);
}

function columnIndex(reference: string) {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "A";
  let index = 0;
  for (const char of letters) index = index * 26 + char.charCodeAt(0) - 64;
  return Math.max(index - 1, 0);
}

function zipEntries(buffer: Buffer) {
  const eocdSignature = 0x06054b50;
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index -= 1) {
    if (buffer.readUInt32LE(index) === eocdSignature) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("Arquivo XLSX inválido: diretório ZIP não encontrado.");

  const count = readUInt16(buffer, eocd + 10);
  const centralSize = readUInt32(buffer, eocd + 12);
  const centralOffset = readUInt32(buffer, eocd + 16);
  const entries = new Map<string, Buffer>();

  let cursor = centralOffset;
  for (let item = 0; item < count; item += 1) {
    if (readUInt32(buffer, cursor) !== 0x02014b50) break;
    const compression = readUInt16(buffer, cursor + 10);
    const compressedSize = readUInt32(buffer, cursor + 20);
    const nameLength = readUInt16(buffer, cursor + 28);
    const extraLength = readUInt16(buffer, cursor + 30);
    const commentLength = readUInt16(buffer, cursor + 32);
    const localOffset = readUInt32(buffer, cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    const localNameLength = readUInt16(buffer, localOffset + 26);
    const localExtraLength = readUInt16(buffer, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = compression === 0 ? compressed : compression === 8 ? inflateRawSync(compressed) : null;
    if (!data) throw new Error(`Método de compressão XLSX não suportado: ${compression}.`);
    entries.set(name, data);
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  if (centralSize === 0 || entries.size === 0) throw new Error("Arquivo XLSX vazio.");
  return entries;
}

function xmlText(xml: string, tag: string) {
  return Array.from(xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g")))
    .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, "")))
    .join("");
}

function parseSharedStrings(xml: string) {
  return Array.from(xml.matchAll(/<si>([\s\S]*?)<\/si>/g)).map((match) => xmlText(match[1], "t"));
}

function parseWorksheet(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const ref = attributes.match(/\br="([A-Z]+\d+)"/)?.[1] ?? "A1";
      const index = columnIndex(ref);
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      let value = "";
      if (type === "inlineStr") value = xmlText(body, "t");
      else {
        const raw = xmlText(body, "v");
        value = type === "s" ? sharedStrings[Number(raw)] ?? "" : raw;
      }
      while (values.length <= index) values.push("");
      values[index] = value;
    }
    if (values.some((value) => value.trim() !== "")) rows.push(values);
  }
  return rows;
}

export function readXlsx(buffer: ArrayBuffer) {
  const entries = zipEntries(Buffer.from(buffer));
  const workbookXml = entries.get("xl/workbook.xml")?.toString("utf8");
  const relsXml = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbookXml || !relsXml) throw new Error("XLSX sem workbook.xml ou relacionamentos.");

  const sharedStrings = entries.get("xl/sharedStrings.xml")
    ? parseSharedStrings(entries.get("xl/sharedStrings.xml")!.toString("utf8"))
    : [];

  const relationships = new Map<string, string>();
  for (const match of relsXml.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = match[1].match(/\bId="([^"]+)"/)?.[1];
    const target = match[1].match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) relationships.set(id, target.replace(/^\//, ""));
  }

  const sheets: Record<string, string[][]> = {};
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const attributes = match[1];
    const name = decodeXml(attributes.match(/\bname="([^"]+)"/)?.[1] ?? "Planilha");
    const relationId = attributes.match(/r:id="([^"]+)"/)?.[1];
    const target = relationId ? relationships.get(relationId) : undefined;
    if (!target) continue;
    const path = target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\//, "")}`;
    const worksheet = entries.get(path);
    if (worksheet) sheets[name] = parseWorksheet(worksheet.toString("utf8"), sharedStrings);
  }

  return sheets;
}

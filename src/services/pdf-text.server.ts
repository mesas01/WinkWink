import { inflateSync } from "node:zlib";

/**
 * Minimal PDF text reader for the offline fallback (no Gemini quota or key). It handles PDFs with
 * a real text layer such as the generated test invoices: it inflates content streams and collects
 * the strings shown by Tj/TJ, one line per text object. Scanned PDFs return "" and still need Gemini.
 */
const STREAM = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
const TEXT_OBJECT = /BT([\s\S]*?)ET/g;
const SHOW = /(<[0-9A-Fa-f\s]*>|\((?:\\.|[^\\)])*\))\s*Tj|\[((?:[^\]\\]|\\.)*)\]\s*TJ/g;
const ARRAY_PART = /<[0-9A-Fa-f\s]*>|\((?:\\.|[^\\)])*\)/g;

/** WinAnsi differs from Latin-1 mostly in 0x80–0x9F; map the punctuation invoices use. */
const WIN_ANSI: Record<number, string> = {
  0x91: "‘",
  0x92: "’",
  0x93: "“",
  0x94: "”",
  0x95: "•",
  0x96: "–",
  0x97: "—",
};

const fromBytes = (bytes: number[]) =>
  bytes.map((b) => WIN_ANSI[b] ?? String.fromCharCode(b)).join("");

function decodeHex(token: string): string {
  const hex = token.slice(1, -1).replace(/\s+/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2)
    bytes.push(parseInt(hex.slice(i, i + 2).padEnd(2, "0"), 16));
  return fromBytes(bytes);
}

function decodeLiteral(token: string): string {
  const body = token.slice(1, -1);
  const bytes: number[] = [];
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if (ch !== "\\") {
      bytes.push(ch.charCodeAt(0));
      continue;
    }
    const next = body[++i] ?? "";
    const octal = /^[0-7]{1,3}/.exec(body.slice(i))?.[0];
    if (octal) {
      bytes.push(parseInt(octal, 8));
      i += octal.length - 1;
    } else
      bytes.push(
        ({ n: 10, r: 13, t: 9, b: 8, f: 12 } as Record<string, number>)[next] ?? next.charCodeAt(0),
      );
  }
  return fromBytes(bytes);
}

const decode = (token: string) => (token.startsWith("<") ? decodeHex(token) : decodeLiteral(token));

function streamContents(pdf: string): string[] {
  const out: string[] = [];
  for (const [, raw] of pdf.matchAll(STREAM)) {
    const bytes = Buffer.from(raw ?? "", "latin1");
    try {
      out.push(inflateSync(bytes).toString("latin1"));
    } catch {
      out.push(raw ?? "");
    }
  }
  return out;
}

function textObjects(content: string): string[] {
  const lines: string[] = [];
  for (const [, block] of content.matchAll(TEXT_OBJECT)) {
    let line = "";
    for (const m of (block ?? "").matchAll(SHOW)) {
      if (m[1]) line += decode(m[1]);
      else for (const part of (m[2] ?? "").match(ARRAY_PART) ?? []) line += decode(part);
    }
    if (line.trim()) lines.push(line.trim());
  }
  return lines;
}

export function extractPdfText(base64: string): string {
  const pdf = Buffer.from(base64, "base64").toString("latin1");
  if (!pdf.startsWith("%PDF")) return "";
  return streamContents(pdf).flatMap(textObjects).join("\n");
}

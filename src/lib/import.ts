import { unzipSync, strFromU8 } from "fflate";

/** Metadata + plain text extracted from an uploaded book file. */
export type ImportedBook = {
  title?: string;
  author?: string;
  /** book body as plain text, paragraphs separated by blank lines */
  text: string;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

/** Turn an HTML/XHTML fragment into plain text with blank-line paragraph breaks. */
function htmlToText(html: string): string {
  const withoutHead = html
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, "");

  const broken = withoutHead
    // block-level boundaries become paragraph breaks
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr)\s*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // drop every remaining tag
    .replace(/<[^>]+>/g, "");

  return decodeEntities(broken)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n\n")
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function firstMatch(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(xml);
  return m ? decodeEntities(m[1].replace(/<[^>]+>/g, "")).trim() : undefined;
}

/** Resolve an href relative to the directory of the OPF file inside the zip. */
function resolvePath(opfPath: string, href: string): string {
  const base = opfPath.includes("/")
    ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1)
    : "";
  const parts = (base + decodeURIComponent(href)).split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function parseEpub(bytes: Uint8Array): ImportedBook {
  const files = unzipSync(bytes);
  const fileNames = Object.keys(files);

  // The container points at the OPF (package) file.
  const container = files["META-INF/container.xml"];
  let opfPath: string | undefined;
  if (container) {
    opfPath = /full-path="([^"]+)"/i.exec(strFromU8(container))?.[1];
  }
  opfPath ??= fileNames.find((f) => f.toLowerCase().endsWith(".opf"));
  if (!opfPath || !files[opfPath]) {
    throw new Error("This EPUB is missing its package file.");
  }

  const opf = strFromU8(files[opfPath]);
  const title = firstMatch(opf, "dc:title") ?? firstMatch(opf, "title");
  const author = firstMatch(opf, "dc:creator") ?? firstMatch(opf, "creator");

  // manifest: id -> href; spine: ordered list of idrefs to read.
  const manifest = new Map<string, string>();
  for (const m of opf.matchAll(/<item\b[^>]*>/gi)) {
    const tag = m[0];
    const id = /id="([^"]+)"/i.exec(tag)?.[1];
    const href = /href="([^"]+)"/i.exec(tag)?.[1];
    if (id && href) manifest.set(id, href);
  }

  const spine = [...opf.matchAll(/<itemref\b[^>]*>/gi)]
    .map((m) => /idref="([^"]+)"/i.exec(m[0])?.[1])
    .filter((id): id is string => Boolean(id));

  const hrefs = spine.length
    ? spine.map((id) => manifest.get(id)).filter((h): h is string => Boolean(h))
    : // no usable spine: fall back to every (x)html file in the archive
      fileNames.filter((f) => /\.x?html?$/i.test(f));

  const parts: string[] = [];
  for (const href of hrefs) {
    const full = spine.length ? resolvePath(opfPath, href) : href;
    const data = files[full];
    if (!data) continue;
    const text = htmlToText(strFromU8(data));
    if (text) parts.push(text);
  }

  const text = parts.join("\n\n");
  if (!text.trim()) throw new Error("No readable text found in this EPUB.");
  return { title, author, text };
}

async function parsePdf(bytes: Uint8Array): Promise<ImportedBook> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;

  const cleaned = merged
    .replace(/\r\n/g, "\n")
    // join words split across a line break by a hyphen
    .replace(/(\w)-\n(\w)/g, "$1$2")
    // a blank line marks a paragraph; single newlines are soft wraps
    .split(/\n{2,}/)
    .map((block) =>
      block
        .replace(/\s*\n\s*/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n\n");

  if (!cleaned.trim()) {
    throw new Error(
      "No selectable text found — this PDF may be scanned images.",
    );
  }
  return { text: cleaned };
}

/** Extract title/author/text from an uploaded EPUB or PDF file. */
export async function importBookFile(file: File): Promise<ImportedBook> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".epub") || file.type === "application/epub+zip") {
    return parseEpub(bytes);
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return parsePdf(bytes);
  }
  throw new Error("Unsupported file — upload an EPUB or PDF.");
}

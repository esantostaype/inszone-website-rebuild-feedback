#!/usr/bin/env node
/**
 * Extrae el texto y las imágenes de un .docx sin pandoc ni dependencias.
 *
 *   node extraer-docx.js "ruta/al/feedback.docx" ./salida
 *
 * Deja:
 *   salida/texto.txt   un párrafo por línea, con el estilo, la numeración de lista
 *                      y el nombre de la imagen que lo acompaña — que es lo que
 *                      permite saber a qué captura se refiere cada comentario
 *   salida/media/      las imágenes tal como venían en el documento
 *
 * Un .docx es un ZIP: word/document.xml lleva el texto, word/media/ las imágenes y
 * word/_rels/document.xml.rels mapea cada referencia (rId7) a su archivo.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const [, , docxPath, outArg] = process.argv;

if (!docxPath) {
  console.error("Uso: node extraer-docx.js <archivo.docx> [carpeta-salida]");
  process.exit(1);
}

const out = path.resolve(outArg || "./salida-docx");
const unpacked = path.join(out, "_docx");

fs.mkdirSync(unpacked, { recursive: true });

/* Descomprimir. unzip existe en Git Bash y en Linux/macOS; en Windows sin él,
   PowerShell hace lo mismo con Expand-Archive sobre una copia .zip. */
function unzip() {
  try {
    execFileSync("unzip", ["-o", "-q", path.resolve(docxPath), "-d", unpacked], { stdio: "pipe" });
    return;
  } catch {
    /* sin unzip: se intenta con PowerShell */
  }

  const zipCopy = path.join(out, "_tmp.zip");
  fs.copyFileSync(path.resolve(docxPath), zipCopy);
  execFileSync("powershell", [
    "-NoProfile", "-Command",
    `Expand-Archive -LiteralPath '${zipCopy}' -DestinationPath '${unpacked}' -Force`,
  ], { stdio: "pipe" });
  fs.unlinkSync(zipCopy);
}

unzip();

const documentXml = path.join(unpacked, "word", "document.xml");
if (!fs.existsSync(documentXml)) {
  console.error("No parece un .docx válido: falta word/document.xml");
  process.exit(1);
}

const xml = fs.readFileSync(documentXml, "utf8");

/* rId → nombre de archivo de la imagen */
const relsPath = path.join(unpacked, "word", "_rels", "document.xml.rels");
const rels = {};
if (fs.existsSync(relsPath)) {
  const relsXml = fs.readFileSync(relsPath, "utf8");
  for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
    rels[m[1]] = path.basename(m[2]);
  }
}

const unescape = (s) => s
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");

const lines = [];

for (const paragraph of xml.split(/<w:p[ >]/).slice(1)) {
  const text = [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join("");
  const images = [...paragraph.matchAll(/r:embed="(rId\d+)"/g)].map((m) => rels[m[1]] || m[1]);
  const style = (paragraph.match(/<w:pStyle w:val="([^"]+)"/) || [])[1];
  const numId = (paragraph.match(/<w:numId w:val="(\d+)"/) || [])[1];

  let line = "";
  if (style) line += `[${style}] `;
  if (numId) line += `(lista${numId}) `;
  line += unescape(text);
  if (images.length) line += ` {{IMG: ${images.join(", ")}}}`;

  lines.push(line);
}

fs.writeFileSync(path.join(out, "texto.txt"), lines.join("\n"), "utf8");

/* Imágenes */
const mediaSrc = path.join(unpacked, "word", "media");
let count = 0;
if (fs.existsSync(mediaSrc)) {
  const mediaOut = path.join(out, "media");
  fs.mkdirSync(mediaOut, { recursive: true });
  for (const file of fs.readdirSync(mediaSrc)) {
    fs.copyFileSync(path.join(mediaSrc, file), path.join(mediaOut, file));
    count++;
  }
}

console.log(`texto.txt · ${lines.length} párrafos`);
console.log(`media/    · ${count} imágenes`);
console.log(`\nSiguiente paso: abrir las imágenes antes de escribir. Las flechas y recuadros
rojos dicen a qué se refiere cada comentario, y renombrarlas por tema
(home-01-padding-header.png) evita perderlas después.`);

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const latestRoot = path.join(ROOT, 'latest');
const outPath = path.join(ROOT, 'assets', 'latest-index.json');

function walkPdfFiles(dir) {
  const rows = [];
  if (!fs.existsSync(dir)) return rows;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && /\.pdf$/i.test(entry.name)) {
        rows.push(full);
      }
    }
  }
  return rows;
}

function toRow(absPath) {
  const rel = path.relative(latestRoot, absPath).split(path.sep);
  const line = rel[0] || '-';
  const lang = rel[1] || '-';
  const fileName = rel[2] || path.basename(absPath);
  const docType = fileName.replace(/\.pdf$/i, '');
  return {
    id: `${line}-${lang}-${docType}`,
    line,
    lang,
    docType,
    effectiveDate: new Date().toISOString().slice(0, 10),
    publicUrl: `https://cimafoundation.github.io/cima-legal-public-docs/latest/${line}/${lang}/${fileName}`,
    downloadFileName: fileName
  };
}

// Preserve publication state and dates when rebuilding from retained repository PDFs.
const previous = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')).rows : [];
const previousById = new Map(previous.map((row) => [row.id, row]));
const files = walkPdfFiles(latestRoot);
const rows = files
  .map(toRow)
  .map((row) => {
    const saved = previousById.get(row.id);
    return saved ? { ...row, ...saved } : row;
  })
  .sort((a, b) => a.line.localeCompare(b.line) || a.lang.localeCompare(b.lang) || a.docType.localeCompare(b.docType));

fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);
console.log(`Generated ${outPath} rows=${rows.length}`);

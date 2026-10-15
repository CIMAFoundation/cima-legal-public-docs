import fs from 'node:fs';
import path from 'node:path';

/** Resolves a canonical PDF path without allowing traversal or external URLs. */
export function documentPath(row) {
  for (const value of [row.line, row.lang, row.docType]) {
    if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value)) {
      throw new Error('Invalid document path');
    }
  }
  return `latest/${row.line}/${row.lang}/${row.docType}.pdf`;
}

/** Changes only publication metadata and rejects unknown or duplicate document IDs. */
export function changePublication(index, action, ids, now = new Date().toISOString()) {
  if (!['withdraw', 'restore'].includes(action) || !Array.isArray(ids) || !ids.length || ids.length > 100) {
    throw new Error('Invalid publication request');
  }
  for (const id of new Set(ids)) {
    const matches = index.rows.filter((row) => row.id === id);
    if (matches.length !== 1) throw new Error(`Unknown or duplicate document: ${id}`);
    documentPath(matches[0]);
  }
  const selected = new Set(ids);
  return { ...index, generatedAt: now, rows: index.rows.map((row) => {
    if (!selected.has(row.id)) return row;
    const next = { ...row };
    if (action === 'withdraw') next.deletedAt = next.deletedAt || now;
    else delete next.deletedAt;
    return next;
  }) };
}

/** Builds Pages from an allowlist, keeping withdrawn PDFs only in the repository. */
export function buildPages(root, output) {
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const entry of ['index.html', 'site-structure.html', 'favicon.ico', 'CNAME', 'assets', 'legacy']) {
    const source = path.join(root, entry);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(output, entry), { recursive: true });
  }
  fs.mkdirSync(path.join(output, 'latest'), { recursive: true });
  fs.copyFileSync(path.join(root, 'latest/index.html'), path.join(output, 'latest/index.html'));
  const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/latest-index.json'), 'utf8'));
  const rows = index.rows.filter((row) => !row.deletedAt);
  for (const row of rows) {
    const relative = documentPath(row);
    const target = path.join(output, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  fs.writeFileSync(path.join(output, 'assets/latest-index.json'), `${JSON.stringify({ ...index, rows }, null, 2)}\n`);
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
}

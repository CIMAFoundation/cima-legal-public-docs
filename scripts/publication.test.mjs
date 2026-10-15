import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildPages, changePublication, documentPath } from './publication.mjs';

const row = { id: 'demo-it-terms-of-use', line: 'demo', lang: 'it', docType: 'terms-of-use',
  effectiveDate: '2026-01-01', publicUrl: 'https://example.org/latest/demo/it/terms-of-use.pdf' };

test('withdrawn URL is absent from Pages, repository PDF survives, restore republishes it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legal-publication-'));
  try {
    fs.mkdirSync(path.join(root, 'assets'));
    fs.mkdirSync(path.join(root, 'latest/demo/it'), { recursive: true });
    fs.writeFileSync(path.join(root, 'latest/index.html'), '<html></html>');
    const pdf = path.join(root, documentPath(row));
    fs.writeFileSync(pdf, 'PDF fixture');
    const original = { rows: [row] };
    const withdrawn = changePublication(original, 'withdraw', [row.id], '2026-10-15');
    assert.equal(original.rows[0].deletedAt, undefined);
    fs.writeFileSync(path.join(root, 'assets/latest-index.json'), JSON.stringify(withdrawn));
    const rebuild = spawnSync(process.execPath, [fileURLToPath(new URL('./build-latest-index.mjs', import.meta.url))], { cwd: root });
    assert.equal(rebuild.status, 0, rebuild.stderr.toString());
    const rebuilt = JSON.parse(fs.readFileSync(path.join(root, 'assets/latest-index.json')));
    assert.equal(rebuilt.rows[0].deletedAt, '2026-10-15');
    assert.equal(rebuilt.rows[0].effectiveDate, row.effectiveDate);
    const output = path.join(root, '_site');
    buildPages(root, output);
    assert.equal(fs.existsSync(path.join(output, documentPath(row))), false);
    assert.equal(fs.readFileSync(pdf, 'utf8'), 'PDF fixture');
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'assets/latest-index.json'))).rows, []);
    assert.equal(fs.existsSync(path.join(output, 'scripts')), false);
    const restored = changePublication(withdrawn, 'restore', [row.id]);
    fs.writeFileSync(path.join(root, 'assets/latest-index.json'), JSON.stringify(restored));
    buildPages(root, output);
    assert.equal(fs.readFileSync(path.join(output, documentPath(row)), 'utf8'), 'PDF fixture');
    assert.equal(restored.rows[0].effectiveDate, row.effectiveDate);
    fs.writeFileSync(path.join(root, 'assets/latest-index.json'), JSON.stringify(withdrawn));
    buildPages(root, output);
    assert.equal(fs.existsSync(path.join(output, documentPath(row))), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invalid actions, missing IDs and path traversal are rejected', () => {
  assert.throws(() => changePublication({ rows: [row] }, 'delete', [row.id]));
  assert.throws(() => changePublication({ rows: [row] }, 'withdraw', ['missing']));
  assert.throws(() => changePublication({ rows: [row, row] }, 'withdraw', [row.id]));
  assert.throws(() => documentPath({ ...row, line: '..' }));
  assert.throws(() => documentPath({ ...row, lang: 'it/../../' }));
});

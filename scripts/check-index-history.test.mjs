import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkIndexHistory } from './check-index-history.mjs';

test('rejects an old index after a merge and on subsequent refreshes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'index-history-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  /** Records an index change with deterministic fixture identity. */
  const commitIndex = (generatedAt) => {
    fs.writeFileSync(path.join(root, 'assets/latest-index.json'), JSON.stringify({ generatedAt, rows: [] }));
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org', 'commit', '-m', 'index');
  };
  try {
    git('init', '-b', 'main');
    fs.mkdirSync(path.join(root, 'assets'));
    commitIndex('2026-10-26T13:37:27.977Z');
    git('branch', 'stale');
    commitIndex('2026-10-26T16:53:03+00:00');
    assert.doesNotThrow(() => checkIndexHistory(root));
    git('switch', 'stale');
    fs.writeFileSync(path.join(root, 'README.md'), 'unrelated change');
    git('add', '.');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org', 'commit', '-m', 'unrelated');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org',
      'merge', 'main', '--no-commit');
    // Reproduce yesterday's resolution: keep PDFs from main, restore the stale index.
    commitIndex('2026-10-26T13:37:27.977Z');
    assert.throws(() => checkIndexHistory(root), /Publication blocked/);
    commitIndex('2026-10-26T13:37:28.977Z');
    assert.throws(() => checkIndexHistory(root), /Publication blocked/);
    commitIndex('2026-10-27T13:57:30+00:00');
    assert.doesNotThrow(() => checkIndexHistory(root));
    fs.writeFileSync(path.join(root, 'assets/latest-index.json'), '{"generatedAt":"invalid"}');
    assert.throws(() => checkIndexHistory(root), /Invalid latest-index/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

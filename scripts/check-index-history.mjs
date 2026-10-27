import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const indexPath = 'assets/latest-index.json';

/** Rejects invalid timestamps rather than silently accepting an unversioned index. */
function generatedAt(index) {
  const timestamp = Date.parse(index.generatedAt);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid latest-index generatedAt');
  return timestamp;
}

/** Prevents stale merges from publishing an index older than its branch history. */
export function checkIndexHistory(root = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const current = generatedAt(JSON.parse(fs.readFileSync(`${root}/${indexPath}`, 'utf8')));
  // Full history retains the main-side index when a merge keeps its stale parent's file.
  const revisions = git('log', '--full-history', '--format=%H', '--', indexPath)
    .split('\n').filter(Boolean);
  for (const revision of revisions) {
    const previous = JSON.parse(git('show', `${revision}:${indexPath}`));
    if (generatedAt(previous) > current) {
      throw new Error(`Publication blocked: latest-index is older than ${revision}. Merge the current index without restoring stale metadata.`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkIndexHistory();
  console.log('Index history checked: no timestamp regression.');
}

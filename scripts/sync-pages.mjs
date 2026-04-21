#!/usr/bin/env node
/**
 * Syncs manifest.json and PDFs to the GitHub Pages repository.
 * 
 * Usage: npm run sync:pages
 * Required env vars:
 *   - PAGES_REPO: owner/repo for Pages (e.g., dedandy/catalog)
 *   - GITHUB_TOKEN: GitHub PAT with repo access to PAGES_REPO
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pagesRepo = process.env.PAGES_REPO || 'dedandy/catalog';
const branch = 'main';
const docsRoot = join(ROOT, 'legal-docs');
const manifestSrc = join(docsRoot, 'manifests', 'latest.json');
const filesSrc = join(docsRoot, 'files');

console.log(`Syncing to ${pagesRepo}...`);

// Read and version manifest
const manifest = JSON.parse(readFileSync(manifestSrc, 'utf8'));
const version = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-');

// Create temp dir
const tmpDir = `/tmp/pages-sync-${Date.now()}`;
mkdirSync(tmpDir, { recursive: true });

// Copy and version manifest
const versionedManifest = {
  ...manifest,
  _meta: {
    version,
    generatedAt: new Date().toISOString(),
    sourceRepo: 'cimafoundation/cima-legal-public-docs'
  }
};

const outManifest = join(tmpDir, 'manifest.json');
writeFileSync(outManifest, JSON.stringify(versionedManifest, null, 2));

// Copy PDFs
const outFiles = join(tmpDir, 'files');
if (existsSync(filesSrc)) {
  cpSync(filesSrc, outFiles, { recursive: true });
  console.log(`Copied PDFs from ${filesSrc}`);
}

// Clone Pages repo
console.log(`Cloning ${pagesRepo}...`);
execSync(`git clone https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${pagesRepo}.git ${tmpDir}/repo --branch ${branch} --single-branch 2>/dev/null || git clone https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${pagesRepo}.git ${tmpDir}/repo`, { stdio: 'inherit' });

const repoDir = join(tmpDir, 'repo');

// Copy files to repo
cpSync(outManifest, join(repoDir, 'manifest.json'), { overwrite: true });
if (existsSync(outFiles)) {
  cpSync(outFiles, join(repoDir, 'files'), { recursive: true });
}

// Commit and push
execSync('git config user.name "CIMA Sync Bot"', { cwd: repoDir });
execSync('git config user.email "bot@cima.legal"', { cwd: repoDir });
execSync('git add .', { cwd: repoDir });

const status = execSync('git status --porcelain', { cwd: repoDir }).toString();
if (status.trim()) {
  execSync(`git commit -m "sync: update from cima-legal-public-docs (${version})"`, { cwd: repoDir });
  execSync(`git push origin ${branch}`, { cwd: repoDir, stdio: 'inherit' });
  console.log(`✓ Pushed to ${pagesRepo}/${branch}`);
} else {
  console.log('No changes to push.');
}

// Cleanup
execSync(`rm -rf ${tmpDir}`);
console.log('Done.');

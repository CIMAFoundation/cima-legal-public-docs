#!/usr/bin/env node
/**
 * Syncs manifest.json and PDFs to the GitHub Pages repository.
 * 
 * Usage: npm run sync:pages
 * Uses GITHUB_TOKEN from environment (provided by GitHub Actions).
 * Required vars:
 *   - GITHUB_TOKEN: Token with write access to PAGES_REPO
 *   - PAGES_REPO: owner/repo for Pages (e.g., dedandy/catalog)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const token = process.env.GITHUB_TOKEN;
const pagesRepo = process.env.PAGES_REPO || 'dedandy/catalog';
const branch = 'main';
const docsRoot = join(ROOT, 'legal-docs');
const manifestSrc = join(docsRoot, 'manifests', 'latest.json');
const filesSrc = join(docsRoot, 'files');

if (!token) {
  console.error('Error: GITHUB_TOKEN not set');
  process.exit(1);
}

console.log(`Syncing to ${pagesRepo}...`);

// Read and version manifest
const manifest = JSON.parse(readFileSync(manifestSrc, 'utf8'));
const version = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '-');

const tmpDir = `/tmp/pages-sync-${Date.now()}`;

try {
  mkdirSync(tmpDir, { recursive: true });

  // Version manifest
  const versionedManifest = {
    ...manifest,
    _meta: {
      version,
      generatedAt: new Date().toISOString(),
      sourceRepo: 'cimafoundation/cima-legal-public-docs'
    }
  };

  writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify(versionedManifest, null, 2));

  // Copy PDFs
  if (existsSync(filesSrc)) {
    cpSync(filesSrc, join(tmpDir, 'files'), { recursive: true });
    console.log(`Copied PDFs`);
  }

  // Clone or init Pages repo
  const repoDir = join(tmpDir, 'repo');
  try {
    execSync(`git clone https://x-access-token:${token}@github.com/${pagesRepo}.git ${repoDir} --branch ${branch} --single-branch`, { stdio: 'pipe' });
    console.log(`Cloned existing ${pagesRepo}`);
  } catch {
    // Empty repo - init fresh
    mkdirSync(repoDir);
    execSync('git init', { cwd: repoDir, stdio: 'pipe' });
    execSync(`git remote add origin https://x-access-token:${token}@github.com/${pagesRepo}.git`, { cwd: repoDir, stdio: 'pipe' });
    execSync(`git checkout -b ${branch}`, { cwd: repoDir, stdio: 'pipe' });
    console.log(`Initialized new ${pagesRepo}`);
  }

  // Copy files
  cpSync(join(tmpDir, 'manifest.json'), join(repoDir, 'manifest.json'), { overwrite: true });
  if (existsSync(join(tmpDir, 'files'))) {
    execSync('rm -rf ' + join(repoDir, 'files'), { stdio: 'pipe' });
    cpSync(join(tmpDir, 'files'), join(repoDir, 'files'), { recursive: true });
  }

  // Commit and push
  execSync('git config user.name "CIMA Sync Bot"', { cwd: repoDir });
  execSync('git config user.email "bot@cima.legal"', { cwd: repoDir });
  execSync('git add .', { cwd: repoDir });

  const status = execSync('git status --porcelain', { cwd: repoDir }).toString();
  if (status.trim()) {
    execSync(`git commit -m "sync: update from cima-legal-public-docs (${version})"`, { cwd: repoDir });
    execSync(`git push origin ${branch}`, { cwd: repoDir });
    console.log(`✓ Pushed to ${pagesRepo}/${branch}`);
  } else {
    console.log('No changes to push.');
  }

} finally {
  rmSync(tmpDir, { recursive: true, force: true });
  console.log('Done.');
}

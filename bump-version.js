#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const headerPath = path.join(process.cwd(), 'header.txt');
const headerContent = fs.readFileSync(headerPath, 'utf-8');

// Extract current version
const versionMatch = headerContent.match(/@version\s+([\d.]+)/);
if (!versionMatch) {
  console.error('Could not find version in header.txt');
  process.exit(1);
}

const currentVersion = versionMatch[1];
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Bump patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update header.txt with new version
const updatedHeader = headerContent.replace(
  /@version\s+[\d.]+/,
  `@version      ${newVersion}`
);

fs.writeFileSync(headerPath, updatedHeader, 'utf-8');

console.log(`Version bumped: ${currentVersion} -> ${newVersion}`);

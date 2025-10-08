#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

try {
  // Get current git tag
  let gitTag = null;
  try {
    gitTag = execSync('git describe --tags --exact-match HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // No exact tag match, try to get the latest tag
    try {
      const describe = execSync('git describe --tags', { encoding: 'utf8' }).trim();
      // Extract tag from describe output (e.g., "v1.0.0-5-g1234567" -> "v1.0.0")
      const match = describe.match(/^([^-]+)/);
      if (match) {
        gitTag = match[1];
      }
    } catch {
      // No tags available
    }
  }

  // Get current commit hash
  const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  
  // Get build date
  const buildDate = new Date().toISOString();
  
  // Determine if this is a production build
  const isProduction = process.env.NODE_ENV === 'production';

  const versionInfo = {
    version: process.env.npm_package_version || '0.0.0',
    gitTag,
    gitCommit,
    buildDate,
    isProduction
  };

  const versionCode = `// Version information that gets injected at build time
export interface VersionInfo {
  version: string
  gitTag: string | null
  gitCommit: string
  buildDate: string
  isProduction: boolean
}

// This will be replaced by Vite during build
export const VERSION_INFO: VersionInfo = ${JSON.stringify(versionInfo, null, 2)}

export function getDisplayVersion(): string {
  if (VERSION_INFO.gitTag) {
    return VERSION_INFO.gitTag
  }
  return 'Beta'
}

export function getFullVersionInfo(): string {
  const displayVersion = getDisplayVersion()
  const commit = VERSION_INFO.gitCommit.substring(0, 7)
  return \`\${displayVersion} (\${commit})\`
}
`;

  // Write the updated version file
  const versionPath = resolve(__dirname, '../src/utils/version.ts');
  writeFileSync(versionPath, versionCode);

  console.log(`✅ Version info updated: ${gitTag || 'Beta'} (${gitCommit.substring(0, 7)})`);
} catch (error) {
  console.warn('⚠️  Could not determine git version:', error);
}

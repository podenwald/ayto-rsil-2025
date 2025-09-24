#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

try {
  // Zuerst DB-Export für Deployment durchführen (immer ausführen)
  console.log('🔄 Führe Datenbank-Export für Deployment durch...');
  try {
    execSync('node scripts/export-current-db.cjs', { stdio: 'inherit' });
  } catch (exportError) {
    console.warn('⚠️ DB-Export fehlgeschlagen, fahre mit Build fort:', exportError.message);
  }
  // Get current git tag
  let gitTag = null;
  try {
    // First try to get exact tag match
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
      // No tags available, try to get all tags and find the latest
      try {
        const allTags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' }).trim();
        if (allTags) {
          const tags = allTags.split('\n').filter(tag => tag.trim());
          if (tags.length > 0) {
            gitTag = tags[0]; // Get the latest tag
          }
        }
      } catch {
        // Still no tags available
        console.log('⚠️ No git tags found');
      }
    }
  }

  // Get current commit hash
  const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  
  // Get build date
  const buildDate = new Date().toISOString();
  
  // Determine if this is a production build
  const isProduction = process.env.NODE_ENV === 'production';

  // Get package.json version
  let packageVersion = '0.0.0';
  try {
    const packageJson = require('../package.json');
    packageVersion = packageJson.version;
  } catch {
    // Fallback if package.json can't be read
  }

  const versionInfo = {
    version: packageVersion,
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
  // Fallback to package.json version if no git tag
  return VERSION_INFO.version || 'Beta'
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

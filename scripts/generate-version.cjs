#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync, readFileSync } = require('fs');
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
  
  // Get build date - always use current date when building (German time)
  const now = new Date();
  // Convert to German time (UTC+1 in winter, UTC+2 in summer)
  // For simplicity, we use UTC+1 (MEZ) - you can adjust for daylight saving time if needed
  const germanTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000 * 1)); // UTC+1
  const buildDate = germanTime.toISOString();
  
  // Determine if this is a production build
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.NETLIFY === 'true' || 
                      process.env.CI === 'true';

  // Read version from package.json
  const packageJsonPath = resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '0.0.0';

  const versionInfo = {
    version,
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

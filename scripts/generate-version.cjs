#!/usr/bin/env node

const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function ensureGitTagsAvailable() {
  try {
    // In CI (Netlify, Vercel, GitHub) werden Repos oft shallow ohne Tags ausgecheckt
    const isRepo = (() => {
      try { run('git rev-parse --is-inside-work-tree'); return true } catch { return false }
    })();
    if (!isRepo) {
      console.warn('⚠️  Kein Git-Repository erkannt – überspringe Tag-Ermittlung.');
      return;
    }

    let isShallow = false;
    try {
      isShallow = run('git rev-parse --is-shallow-repository') === 'true';
    } catch {
      // Fallback: Prüfen, ob .git/shallow existiert
      try { run('test -f .git/shallow && echo true || echo false'); } catch {}
    }

    try {
      // Stets Tags holen; bei shallow zuvor unshallow
      if (isShallow) {
        console.log('🔧 Unshallow Repository und lade Tags...');
        try { execSync('git fetch --unshallow --tags --prune --force', { stdio: 'inherit' }); } catch {}
      }
      console.log('🔧 Synchronisiere Tags vom Remote...');
      execSync('git fetch --tags --prune --force', { stdio: 'inherit' });
    } catch (e) {
      console.warn('⚠️  Konnte Tags nicht synchronisieren:', e.message);
    }
  } catch (e) {
    console.warn('⚠️  Fehler bei Git-Setup-Erkennung:', e.message);
  }
}

try {
  // Zuerst DB-Export für Deployment durchführen (immer ausführen)
  console.log('🔄 Führe Datenbank-Export für Deployment durch...');
  try {
    execSync('node scripts/export-current-db.cjs', { stdio: 'inherit' });
  } catch (exportError) {
    console.warn('⚠️ DB-Export fehlgeschlagen, fahre mit Build fort:', exportError.message);
  }
  
  // Sicherstellen, dass Git-Tags verfügbar sind (wichtig für Netlify/CI)
  ensureGitTagsAvailable();
  // Get current git tag
  let gitTag = null;
  try {
    // First try to get exact tag match
    gitTag = run('git describe --tags --exact-match HEAD');
  } catch {
    // No exact tag match, try to get the latest tag
    try {
      const describe = run('git describe --tags');
      // Extract tag from describe output (e.g., "v1.0.0-5-g1234567" -> "v1.0.0")
      const match = describe.match(/^([^-]+)/);
      if (match) {
        gitTag = match[1];
      }
    } catch {
      // No tags available, try to get all tags and find the latest
      try {
        const allTags = run('git tag --sort=-version:refname');
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
  const gitCommit = run('git rev-parse HEAD');
  
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

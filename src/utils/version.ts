// Version information that gets injected at build time
export interface VersionInfo {
  version: string
  gitTag: string | null
  gitCommit: string
  buildDate: string
  isProduction: boolean
}

// This will be replaced by Vite during build
export const VERSION_INFO: VersionInfo = {
  "version": "0.4.5",
  "gitTag": "v0.4.5",
  "gitCommit": "1c891d53160e278ec89bd133af88ffe115eaae2a",
  "buildDate": "2025-10-01T21:15:00.000Z",
  "isProduction": false
}

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
  return `${displayVersion} (${commit})`
}

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
  "version": "0.4.3",
  "gitTag": "v0.4.3",
  "gitCommit": "ef7bf39063d831c860ce6575692ebac976c3fe6b",
  "buildDate": "2025-10-01T13:25:17.484Z",
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

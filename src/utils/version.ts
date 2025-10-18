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
  "version": "0.5.7",
  "gitTag": "v0.5.7",
  "gitCommit": "d958cd0001cf7272f2992cb834fc44893fe9bcec",
  "buildDate": "2025-10-18T20:36:54.454Z",
  "isProduction": false
}

export function getDisplayVersion(): string {
  if (VERSION_INFO.gitTag) {
    return VERSION_INFO.gitTag
  }
  return 'Beta'
}

export function getFullVersionInfo(): string {
  const displayVersion = getDisplayVersion()
  const commit = VERSION_INFO.gitCommit.substring(0, 7)
  return `${displayVersion} (${commit})`
}

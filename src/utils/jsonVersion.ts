export const JSON_VERSION_STORAGE_KEY = 'ayto-last-json-file'

/**
 * Extrahiert ein Datum im Format YYYY-MM-DD aus einem Dateinamen
 */
export function extractDateFromFilename(fileName: string): Date | null {
  if (!fileName) return null
  const match = fileName.match(/(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])/)
  if (!match) return null
  const [year, month, day] = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)]
  // Konstruiere als UTC, vermeide TZ-Drift
  const date = new Date(Date.UTC(year, month - 1, day))
  return isNaN(date.getTime()) ? null : date
}

export function getLastImportedJsonInfo(): { fileName: string | null; date: Date | null } {
  try {
    const fileName = localStorage.getItem(JSON_VERSION_STORAGE_KEY)
    return { fileName, date: fileName ? extractDateFromFilename(fileName) : null }
  } catch {
    return { fileName: null, date: null }
  }
}

export function saveLastImportedJsonFile(fileName: string): void {
  try {
    localStorage.setItem(JSON_VERSION_STORAGE_KEY, fileName)
  } catch {
    // ignore
  }
}

export function isFileNewerThanLast(fileName: string): {
  isNewer: boolean | null
  lastFileName: string | null
  lastDate: Date | null
  currentDate: Date | null
} {
  const currentDate = extractDateFromFilename(fileName)
  const { fileName: lastFileName, date: lastDate } = getLastImportedJsonInfo()
  if (!currentDate || !lastDate) {
    return { isNewer: null, lastFileName, lastDate, currentDate }
  }
  return {
    isNewer: currentDate.getTime() > lastDate.getTime(),
    lastFileName,
    lastDate,
    currentDate
  }
}



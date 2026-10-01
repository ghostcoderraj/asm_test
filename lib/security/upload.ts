const MAX_IMPORT_ROWS = 2000

export function importRowLimit() {
  return MAX_IMPORT_ROWS
}

export async function acceptedQuestionFile(file: File) {
  const name = file.name.toLowerCase()
  if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) return "Upload a CSV or XLSX file."
  if (file.name.includes("..") || file.name.includes("/") || file.name.includes("\\")) return "That file name is not allowed."
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const executable = bytes[0] === 0x4d && bytes[1] === 0x5a
  if (executable) return "That file type is not allowed."
  if (name.endsWith(".xlsx") && !zip) return "The workbook is not a valid Excel file."
  if (name.endsWith(".csv") && zip) return "A spreadsheet was uploaded with a CSV name."
  return null
}

import ExcelJS from "exceljs"
import Papa from "papaparse"
import { mapImportRow, missingImportHeaders, type ImportRow } from "@/lib/import/headers"

export async function parseQuestionFile(file: File) {
  const name = file.name.toLowerCase()
  if (name.endsWith(".csv")) {
    const parsed = Papa.parse<Record<string, unknown>>(await file.text(), { header: true, skipEmptyLines: true })
    const headers = parsed.meta.fields ?? []
    return {
      missing: missingImportHeaders(headers),
      sheet: "",
      rows: parsed.data.map((row) => mapImportRow(row)),
    }
  }

  const workbook = new ExcelJS.Workbook()
  const bytes = await file.arrayBuffer()
  await workbook.xlsx.load(Buffer.from(bytes) as unknown as ExcelJS.Buffer)
  const sheet = workbook.worksheets.find((item) => sheetHeaders(item).some((header) => header.trim().toLowerCase() === "question"))
  if (!sheet) return { missing: ["question"], sheet: "", rows: [] as ImportRow[] }

  const headers = sheetHeaders(sheet)
  const rows: ImportRow[] = []
  sheet.eachRow((row, index) => {
    if (index === 1) return
    const raw: Record<string, unknown> = {}
    headers.forEach((header, headerIndex) => {
      if (!header) return
      raw[header] = row.getCell(headerIndex + 1).text
    })
    if (Object.values(raw).some((value) => String(value ?? "").trim())) rows.push(mapImportRow(raw))
  })
  return { missing: missingImportHeaders(headers.filter(Boolean)), sheet: sheet.name, rows }
}

function sheetHeaders(sheet: ExcelJS.Worksheet) {
  const headers: string[] = []
  sheet.getRow(1).eachCell((cell, column) => {
    headers[column - 1] = String(cell.text || "")
  })
  return headers
}

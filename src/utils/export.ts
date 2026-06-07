import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

export function exportToPDF(
  title: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string
): void {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 20)
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28)

  autoTable(doc, {
    startY: 35,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => String(row[col.key] ?? ''))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233] },
  })

  doc.save(`${filename}.pdf`)
}

export function exportToExcel(
  sheetName: string,
  columns: ExportColumn[],
  data: Record<string, unknown>[],
  filename: string
): void {
  const rows = data.map((row) => {
    const mapped: Record<string, unknown> = {}
    columns.forEach((col) => {
      mapped[col.header] = row[col.key] ?? ''
    })
    return mapped
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

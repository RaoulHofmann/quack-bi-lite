<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <button @click="saveReport"
        class="border border-gray-200 rounded-xl p-5 text-center hover:bg-gray-50 transition-colors bg-white">
        <svg class="w-8 h-8 mx-auto text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        <p class="font-medium text-gray-700 text-sm">Save to browser</p>
        <p class="text-xs text-gray-400 mt-1">Stored locally on this device</p>
      </button>
      <button @click="exportExcel" :disabled="!canExport"
        class="border border-gray-200 rounded-xl p-5 text-center hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed">
        <svg class="w-8 h-8 mx-auto text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        <p class="font-medium text-gray-700 text-sm">Export to Excel</p>
        <p class="text-xs text-gray-400 mt-1">Multi-sheet workbook with charts</p>
      </button>
      <button @click="exportDashboard" :disabled="!canExport"
        class="border border-gray-200 rounded-xl p-5 text-center hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed">
        <svg class="w-8 h-8 mx-auto text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
        </svg>
        <p class="font-medium text-gray-700 text-sm">Export as JSON</p>
        <p class="text-xs text-gray-400 mt-1">Shareable dashboard file</p>
      </button>
      <button @click="exportPDF" :disabled="!canExport"
        class="border border-gray-200 rounded-xl p-5 text-center hover:bg-gray-50 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed">
        <svg class="w-8 h-8 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0a41.862 41.862 0 015.376 5.68m7.104-5.68c.24.03.48.062.72.096m-.72-.096a41.876 41.876 0 00-3.072 5.458m0 0A73.416 73.416 0 0112 21a73.416 73.416 0 01-5.352-1.887m7.104 0a54.433 54.433 0 00-4.032 0m7.104 0a41.876 41.876 0 01-3.072 5.458M7.2 13.829a41.76 41.76 0 013.744-6.76 43.238 43.238 0 014.112 6.76m-7.856 0a74.52 74.52 0 0110.56 0m0 0a41.876 41.876 0 013.072 5.458M12 3l.008.008" />
        </svg>
        <p class="font-medium text-gray-700 text-sm">Export as PDF</p>
        <p class="text-xs text-gray-400 mt-1">Printable report document</p>
      </button>
    </div>

    <!-- Chart image downloads -->
    <div v-if="chartImages.length" class="border-t border-gray-200 pt-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Chart images</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="img in chartImages" :key="img.id" @click="downloadImage(img)"
          class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded px-3 py-1.5 transition-colors">
          Download {{ img.title || 'chart' }}.png
        </button>
        <button @click="downloadAllImages"
          class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded px-3 py-1.5 transition-colors font-medium">
          Download all as ZIP
        </button>
      </div>
    </div>

    <div v-if="savedReports.length" class="border-t border-gray-200 pt-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Saved reports</h3>
      <div class="space-y-2">
        <div v-for="r in savedReports" :key="r.id"
          class="flex items-center justify-between py-2.5 px-4 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ r.name }}</p>
            <p class="text-xs text-gray-400">{{ new Date(r.savedAt).toLocaleString() }}</p>
          </div>
          <div class="flex gap-2 shrink-0 ml-4">
            <button @click="loadReport(r.id)" class="text-xs text-blue-600 hover:underline px-2 py-1">Open</button>
            <button @click="deleteReport(r.id)" class="text-xs text-red-400 hover:underline px-2 py-1">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Import dashboard</h3>
      <label class="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span>Choose a JSON file to import</span>
        <input type="file" accept=".json" @change="importDashboard" class="hidden" />
      </label>
    </div>

    <div v-if="message" class="text-sm font-medium rounded-lg px-4 py-2" :class="messageType === 'error' ? 'text-red-600 bg-red-50 border border-red-200' : 'text-green-600 bg-green-50 border border-green-200'">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'

const props = defineProps({
  reportConfig: { type: Object, default: () => ({}) },
  hasData: { type: Boolean, default: false },
  rawColumns: { type: Array, default: () => [] },
  rawRows: { type: Array, default: () => [] },
  tables: { type: Array, default: () => [] },
  chartDataQuery: { type: Function, default: async () => [] },
  chartImages: { type: Array, default: () => [] },
  dashboardImage: { type: String, default: '' },
  fetchFullTable: { type: Function, default: async () => [] },
  captureDashboard: { type: Function, default: async () => null },
})

const emit = defineEmits(['load-report'])
const message = ref('')
const messageType = ref('success')

const canExport = computed(() => props.rawRows.length > 0 || (props.reportConfig.charts || []).some(c => c.queryResult?.length))
const savedReports = ref(JSON.parse(localStorage.getItem('quickbi_reports') || '[]'))

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } }
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
const ALT_ROW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } }

function toSafe(obj) {
  return JSON.parse(JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? Number(v) : v))
}

function saveReport() {
  const list = JSON.parse(localStorage.getItem('quickbi_reports') || '[]')
  list.push({
    id: (Date.now() + Math.random().toString(36).slice(2, 8)).toString(36),
    name: props.reportConfig.name || 'Untitled',
    config: toSafe(props.reportConfig),
    savedAt: Date.now(),
  })
  localStorage.setItem('quickbi_reports', JSON.stringify(list))
  savedReports.value = list
  showMessage('Report saved to browser!')
}

function loadReport(id) {
  const found = (JSON.parse(localStorage.getItem('quickbi_reports') || '[]')).find(r => r.id === id)
  if (found) emit('load-report', found.config)
}

function deleteReport(id) {
  const list = JSON.parse(localStorage.getItem('quickbi_reports') || '[]')
  localStorage.setItem('quickbi_reports', JSON.stringify(list.filter(r => r.id !== id)))
  savedReports.value = JSON.parse(localStorage.getItem('quickbi_reports') || '[]')
}

// --- Helpers ---

function sanitizeSheetName(name) {
  return String(name).replace(/[\\\/\?\*\[\]\:]/g, '').slice(0, 31) || 'Sheet'
}

function colLetter(n) {
  let s = ''
  while (n >= 0) { s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26) - 1 }
  return s
}

function addAutoFilter(ws, lastCol, lastRow) {
  if (lastCol && lastRow > 1) {
    ws.autoFilter = { from: { row: 1, col: 1 }, to: { row: lastRow, col: lastCol } }
  }
}

function styleHeaderRow(ws, colCount) {
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(1, c)
    cell.font = HEADER_FONT
    cell.fill = HEADER_FILL
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    }
  }
  ws.getRow(1).height = 22
}

function styleDataCells(ws, rowCount, colCount) {
  for (let r = 2; r <= rowCount; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c)
      if (r % 2 === 0) cell.fill = ALT_ROW_FILL
      cell.border = {
        bottom: { style: 'hair' },
        left: { style: 'hair' }, right: { style: 'hair' },
      }
    }
  }
}

function cleanValue(v) {
  if (v == null) return null
  if (typeof v === 'object' && v instanceof Date) return v
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.startsWith('"') && t.endsWith('"')) return cleanValue(t.slice(1, -1))
    if (t !== '' && !isNaN(Number(t))) return Number(t)
    if (t === '' || t === '-' || t === '—') return null
    return t
  }
  return v
}

function writeRows(ws, rows, columns) {
  if (!rows.length) return
  const headers = columns.map(c => c.name || c)
  ws.addRow(headers)
  for (const row of rows) {
    ws.addRow(headers.map(h => cleanValue(row[h])))
  }
  // Auto-fit columns
  headers.forEach((h, i) => {
    const maxLen = rows.reduce((m, r) => {
      const v = r[h]; const s = v != null ? String(v).length : 0
      return s > m ? s : m
    }, h.length)
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 8), 40)
  })
  // Apply styles
  const lastRow = rows.length + 1
  const lastCol = headers.length
  styleHeaderRow(ws, lastCol)
  styleDataCells(ws, lastRow, lastCol)
  return { lastRow, lastCol, headers }
}

// --- Excel export ---

async function exportExcel() {
  const name = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Quack BI Lite'
  wb.created = new Date()

  let hasData = false

  // --- Cover sheet ---
  const coverWs = wb.addWorksheet('Cover')
  const cfg = props.reportConfig
  const genDate = new Date().toLocaleString()

  // Title
  coverWs.getCell('B1').value = cfg.name || 'Quack BI Report'
  coverWs.getCell('B1').font = { bold: true, size: 22, color: { argb: 'FF1F4E79' } }
  coverWs.mergeCells('B1:H1')
  coverWs.getRow(1).height = 36

  // Dashboard screenshot as the hero
  const dashImg = props.dashboardImage
  if (dashImg) {
    const b64 = dashImg.split(',')[1]
    if (b64) {
      const imageId = wb.addImage({ base64: b64, extension: 'png' })
      coverWs.addImage(imageId, {
        tl: { col: 1, row: 2 },
        ext: { width: 650, height: 380 },
      })
      // Set row heights for the image area (approx 380px / 15px per row = ~25 rows)
      for (let r = 3; r < 28; r++) coverWs.getRow(r).height = 15
    }
  }

  // Metadata section below the image
  const metaRow = dashImg ? 29 : 3
  coverWs.getCell('B' + metaRow).value = 'Generated: ' + genDate
  coverWs.getCell('B' + metaRow).font = { size: 10, color: { argb: 'FF64748B' } }
  coverWs.mergeCells('B' + metaRow + ':H' + metaRow)

  const mr = metaRow + 2
  coverWs.getCell('B' + mr).value = 'Data Sources'
  coverWs.getCell('B' + mr).font = { bold: true, size: 11, color: { argb: 'FF1F4E79' } }
  if ((cfg.tables || []).length) {
    const tr = mr + 1
    ;['B' + tr, 'C' + tr, 'D' + tr, 'E' + tr].forEach(c => {
      coverWs.getCell(c).font = HEADER_FONT; coverWs.getCell(c).fill = HEADER_FILL
    })
    coverWs.getCell('B' + tr).value = 'Table'
    coverWs.getCell('C' + tr).value = 'File'
    coverWs.getCell('D' + tr).value = 'Cols'
    coverWs.getCell('E' + tr).value = 'Rows'
    cfg.tables.forEach((t, i) => {
      const r = tr + 1 + i
      const tbl = props.tables.find(x => x.name === t.name)
      coverWs.getCell('B' + r).value = t.name
      coverWs.getCell('C' + r).value = t.fileName || ''
      coverWs.getCell('D' + r).value = tbl ? tbl.columns.length : ''
      coverWs.getCell('E' + r).value = tbl ? tbl.rowCount : ''
    })
  }

  const charts = cfg.charts || []
  if (charts.length) {
    const chartSec = mr + (cfg.tables || []).length + 3
    coverWs.getCell('B' + chartSec).value = 'Charts (' + charts.length + ')'
    coverWs.getCell('B' + chartSec).font = { bold: true, size: 11, color: { argb: 'FF1F4E79' } }
    const chr = chartSec + 1
    ;['B' + chr, 'C' + chr, 'D' + chr, 'E' + chr, 'F' + chr].forEach(c => {
      coverWs.getCell(c).font = HEADER_FONT; coverWs.getCell(c).fill = HEADER_FILL
    })
    coverWs.getCell('B' + chr).value = 'Title'
    coverWs.getCell('C' + chr).value = 'Type'
    coverWs.getCell('D' + chr).value = 'X'
    coverWs.getCell('E' + chr).value = 'Y'
    coverWs.getCell('F' + chr).value = 'Agg'
    charts.forEach((c, i) => {
      const r = chr + 1 + i
      coverWs.getCell('B' + r).value = c.title || ''
      coverWs.getCell('C' + r).value = c.chartType || ''
      coverWs.getCell('D' + r).value = c.xCol || ''
      coverWs.getCell('E' + r).value = c.yCol || ''
      coverWs.getCell('F' + r).value = c.agg || ''
    })
  }

  coverWs.getColumn(1).width = 4
  coverWs.getColumn(2).width = 22
  coverWs.getColumn(3).width = 16
  coverWs.getColumn(4).width = 10
  coverWs.getColumn(5).width = 10
  coverWs.getColumn(6).width = 14
  coverWs.getColumn(7).width = 14
  coverWs.getColumn(8).width = 14

  // --- Per-table data sheets ---
  for (const table of props.tables) {
    try {
      const allRows = await props.fetchFullTable(table.name)
      if (!allRows.length) continue
      const ws = wb.addWorksheet(sanitizeSheetName(table.name))
      const { lastRow, lastCol } = writeRows(ws, allRows, table.columns)
      addAutoFilter(ws, lastCol, lastRow)
      hasData = true
    } catch {}
  }

  // --- All Data sheet (joined) ---
  let allDataSheetName = null
  let allDataHeaderCols = []
  try {
    const allData = await props.chartDataQuery()
    if (allData.length) {
      const dataCols = Object.keys(allData[0])
      const ws = wb.addWorksheet('All Data')
      const { lastRow, lastCol, headers } = writeRows(ws, allData, dataCols)
      addAutoFilter(ws, lastCol, lastRow)
      allDataSheetName = 'All Data'
      allDataHeaderCols = headers
      hasData = true
    }
  } catch {}

  // --- Chart sheets (data + embedded image) ---
  // Build column letter map for the sheet we'll reference in formulas
  const refSheet = allDataSheetName || (props.tables.length > 0 ? sanitizeSheetName(props.tables[0].name) : null)
  const refCols = allDataSheetName ? allDataHeaderCols : (props.tables[0]?.columns || []).map(c => c.name)
  const refColLetters = {}
  refCols.forEach((c, i) => { refColLetters[c] = colLetter(i) })

  for (const img of props.chartImages) {
    const data = img.queryResult
    if (!data || !data.length) continue
    const ws = wb.addWorksheet(sanitizeSheetName(img.title || 'Chart'))
    const keys = Object.keys(data[0])

    // Header row
    ws.addRow(keys)

    // Figure out formula references to the reference sheet
    const xLetter = refColLetters[img.xCol]
    const yLetter = refColLetters[img.yCol]
    const canUseFormula = refSheet && xLetter && yLetter
    const agg = (img.agg || 'SUM').toUpperCase()

    // Data rows with formulas where possible
    for (let ri = 0; ri < data.length; ri++) {
      const r = data[ri]
      const rowNum = ri + 2
      const rowData = []
      for (let ci = 0; ci < keys.length; ci++) {
        const key = keys[ci]
        if (ci === 0) {
          rowData.push(cleanValue(r[key]))
        } else if (ci === 1 && canUseFormula) {
          const xVal = r[keys[0]]
          if (xVal != null) {
            const sheet = "'" + refSheet + "'"
            let formula
            if (agg === 'SUM') formula = 'SUMIF(' + sheet + '!' + xLetter + ':' + xLetter + ',A' + rowNum + ',' + sheet + '!' + yLetter + ':' + yLetter + ')'
            else if (agg === 'AVG') formula = 'AVERAGEIF(' + sheet + '!' + xLetter + ':' + xLetter + ',A' + rowNum + ',' + sheet + '!' + yLetter + ':' + yLetter + ')'
            else if (agg === 'MIN') formula = 'MINIFS(' + sheet + '!' + yLetter + ':' + yLetter + ',' + sheet + '!' + xLetter + ':' + xLetter + ',A' + rowNum + ')'
            else if (agg === 'MAX') formula = 'MAXIFS(' + sheet + '!' + yLetter + ':' + yLetter + ',' + sheet + '!' + xLetter + ':' + xLetter + ',A' + rowNum + ')'
            else if (agg === 'COUNT') formula = 'COUNTIF(' + sheet + '!' + xLetter + ':' + xLetter + ',A' + rowNum + ')'
            else formula = ''
            rowData.push(formula ? { formula } : cleanValue(r[key]))
          } else {
            rowData.push(cleanValue(r[key]))
          }
        } else {
          rowData.push(cleanValue(r[key]))
        }
      }
      ws.addRow(rowData)
    }

    // Style
    const lastRow = data.length + 1
    const lastCol = keys.length
    styleHeaderRow(ws, lastCol)
    styleDataCells(ws, lastRow, lastCol)
    keys.forEach((k, i) => { ws.getColumn(i + 1).width = Math.max(12, Math.min(k.length * 2 + 6, 30)) })

    // Embed chart image below data, preserving aspect ratio
    const imgRow = lastRow + 2
    const b64 = img.dataUrl.split(',')[1]
    if (b64) {
      const imgObj = new Image()
      imgObj.src = img.dataUrl
      await new Promise(r => { imgObj.onload = r })
      const ar = imgObj.naturalHeight / imgObj.naturalWidth
      const imgW = 480
      const imgH = Math.round(imgW * ar)
      const imageId = wb.addImage({ base64: b64, extension: 'png' })
      ws.addImage(imageId, {
        tl: { col: 0, row: imgRow - 1 },
        ext: { width: imgW, height: imgH },
      })
    }
    addAutoFilter(ws, lastCol, lastRow)
    hasData = true
  }

  if (!hasData) { showMessage('No data to export.', 'error'); return }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name + '.xlsx'; a.click()
  URL.revokeObjectURL(url)
  showMessage('Excel workbook with charts downloaded!')
}

// --- PDF export ---

async function exportPDF() {
  const name = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_')
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageW = 190
  const margin = 20

  // --- Cover page ---
  doc.setFontSize(24)
  doc.text(props.reportConfig.name || 'Quack BI Report', margin, 30)
  doc.setFontSize(11)
  doc.text('Generated: ' + new Date().toLocaleString(), margin, 40)
  doc.setFontSize(10)
  doc.text('Data sources: ' + ((props.reportConfig.tables || []).map(t => t.name).join(', ') || 'None'), margin, 50)
  doc.text('Charts: ' + (props.reportConfig.charts?.length || 0), margin, 56)

  if ((props.reportConfig.charts || []).length) {
    doc.setFontSize(13)
    doc.text('Charts in this report', margin, 68)
    doc.setFontSize(9)
    const charts = props.reportConfig.charts
    charts.forEach((c, i) => {
      const y = 76 + i * 5
      if (y > 270) return
      doc.text((i + 1) + '. ' + (c.title || 'Untitled') + ' — ' + (c.chartType || '') + ' (' + (c.agg || 'SUM') + ' of ' + (c.yCol || '?') + ' by ' + (c.xCol || '?') + ')', margin, y)
    })
  }

  // --- Dashboard screenshot (if available) ---
  const dashImg = await props.captureDashboard()
  if (dashImg) {
    doc.addPage('l', 'mm')
    const pw = 297, ph = 210, m = 10
    const imgW = pw - m * 2
    const imgObj = new Image()
    imgObj.src = dashImg
    await new Promise(r => { imgObj.onload = r })
    const ar = imgObj.naturalHeight / imgObj.naturalWidth
    const imgH = imgW * ar
    doc.addImage(dashImg, 'PNG', m, Math.max(m, (ph - imgH) / 2), imgW, Math.min(imgH, ph - m * 2))
  }

  // --- Individual chart pages ---
  for (const img of props.chartImages) {
    doc.addPage('p', 'mm', 'a4')
    let y = margin

    doc.setFontSize(14)
    doc.text(img.title || 'Chart', margin, y)
    y += 8

    doc.setFontSize(9)
    doc.text('Type: ' + (img.chartType || '') + ' | X: ' + (img.xCol || '') + ' | Y: ' + (img.yCol || '') + ' | Aggregation: ' + (img.agg || ''), margin, y)
    y += 6

    const imgH = 100
    const imgW = pageW
    const padding = 5
    doc.addImage(img.dataUrl, 'PNG', margin, y + padding, imgW, imgH)
    y += imgH + padding * 2

    // Chart data table
    const data = img.queryResult
    if (data && data.length) {
      const keys = Object.keys(data[0])
      const colW = imgW / keys.length
      doc.setFontSize(7)
      // Header
      doc.setFillColor(31, 78, 121)
      doc.setTextColor(255, 255, 255)
      keys.forEach((k, i) => {
        doc.text(k, margin + i * colW + 1, y + 4)
      })
      doc.setTextColor(0, 0, 0)
      y += 8
      // Rows (up to 20)
      for (let ri = 0; ri < Math.min(data.length, 20); ri++) {
        const row = data[ri]
        keys.forEach((k, i) => {
          const v = row[k] != null ? String(row[k]).slice(0, 20) : '—'
          doc.text(v, margin + i * colW + 1, y + 3)
        })
        y += 4
        if (y > 275) break
      }
    }
  }

  doc.save(name + '.pdf')
  showMessage('PDF report downloaded!')
}

// --- JSON export ---

function exportDashboard() {
  const blob = new Blob([JSON.stringify(toSafe(props.reportConfig), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_') + '.json'; a.click()
  URL.revokeObjectURL(url)
  showMessage('JSON file downloaded!')
}

function importDashboard(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try { emit('load-report', JSON.parse(ev.target.result)); showMessage('Dashboard imported!') }
    catch { showMessage('Could not read this file.', 'error') }
  }
  reader.readAsText(file)
  e.target.value = ''
}

// --- Image downloads ---

function downloadImage(img) {
  const a = document.createElement('a')
  a.href = img.dataUrl
  a.download = (img.title || 'chart').replace(/[^a-z0-9]/gi, '_') + '.png'
  a.click()
  showMessage('Downloaded ' + (img.title || 'chart') + '.png')
}

async function downloadAllImages() {
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (const img of props.chartImages) {
      const b64 = img.dataUrl.split(',')[1]
      if (b64) zip.file((img.title || 'chart').replace(/[^a-z0-9]/gi, '_') + '.png', b64, { base64: true })
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_') + '_charts.zip'; a.click()
    URL.revokeObjectURL(url)
    showMessage('Chart images downloaded as ZIP!')
  } catch {
    for (const img of props.chartImages) downloadImage(img)
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type || 'success'
  setTimeout(() => { if (message.value === msg) { message.value = ''; messageType.value = 'success' } }, 4000)
}
</script>

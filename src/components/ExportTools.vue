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

    <div class="border-t border-gray-200 pt-6">
      <label class="block text-sm font-medium text-gray-600 mb-1">Report description (appears in Excel)</label>
      <textarea v-model="reportDescription" rows="2"
        class="w-full max-w-lg border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Monthly sales breakdown by region and product category"></textarea>
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
const reportDescription = ref('')

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
      if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd'
    }
  }
}

function cleanValue(v) {
  if (v == null) return null
  if (typeof v === 'object' && v instanceof Date) return v
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'number' && !isNaN(v)) return v
  if (typeof v === 'string') {
    const asDate = tryParseDate(v)
    if (asDate) return asDate
    const t = v.trim()
    const stripped = (t.startsWith('"') && t.endsWith('"')) ? t.slice(1, -1).trim() : t
    if (stripped === '' || stripped === '-' || stripped === '\u2014') return null
    const num = Number(stripped)
    if (stripped !== '' && !isNaN(num)) return num
    return stripped
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function tryParseDate(v) {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2})?/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d
  }
  return null
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

const CHART_COLORS = { bar: 'FF3B82F6', line: 'FF10B981', pie: 'FF8B5CF6', doughnut: 'FFEC4899', polarArea: 'FFF59E0B', radar: 'FF06B6D4' }

function getChartTypeColor(type) {
  return CHART_COLORS[type] || 'FF1F4E79'
}

async function exportExcel() {
  const name = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Quack BI Lite'
  wb.created = new Date()

  let hasData = false
  const cfg = props.reportConfig
  const genDate = new Date().toLocaleString()
  const charts = cfg.charts || []
  const desc = reportDescription.value || ''

  // ========================
  // COVER SHEET (with dashboard image)
  // ========================
  const coverWs = wb.addWorksheet('Cover')
  coverWs.getColumn(1).width = 4
  coverWs.getColumn(2).width = 80
  coverWs.getRow(1).height = 36

  coverWs.getCell('B1').value = cfg.name || 'Quack BI Report'
  coverWs.getCell('B1').font = { bold: true, size: 22, color: { argb: 'FF1F4E79' } }
  coverWs.mergeCells('B1:B1')

  if (desc) {
    coverWs.getCell('B2').value = desc
    coverWs.getCell('B2').font = { size: 11, color: { argb: 'FF64748B' }, italic: true }
    coverWs.getRow(2).height = 20
  }

  const infoRow = desc ? 4 : 3
  coverWs.getCell('B' + infoRow).value = 'Generated: ' + genDate + '  |  Tables: ' + (cfg.tables || []).length + '  |  Charts: ' + charts.length
  coverWs.getCell('B' + infoRow).font = { size: 10, color: { argb: 'FF64748B' } }

  // Add dashboard screenshot below header
  let coverImgRow = infoRow + 2
  const dashB64 = props.dashboardImage?.split(',')[1]
  if (dashB64) {
    const imgObj = new Image()
    imgObj.src = props.dashboardImage
    await new Promise(r => { imgObj.onload = r })
    const ar = imgObj.naturalHeight / imgObj.naturalWidth
    const imgW = 640
    const imgH = Math.round(imgW * ar)
    const imageId = wb.addImage({ base64: dashB64, extension: 'png' })
    coverWs.addImage(imageId, {
      tl: { col: 0, row: coverImgRow - 1 },
      ext: { width: imgW, height: imgH },
    })
    coverWs.getRow(coverImgRow).height = imgH * 0.75 + 10
    coverImgRow += Math.ceil(imgH / 15) + 1
  }

  // Brief metadata summary below image
  coverWs.getCell('B' + coverImgRow).value = 'Charts: ' + charts.length + '  |  Data sources: ' + (cfg.tables || []).map(t => t.name).join(', ')
  coverWs.getCell('B' + coverImgRow).font = { size: 10, color: { argb: 'FF64748B' } }

  // ========================
  // PRE-FETCH ALL DATA (for chart formulas)
  // ========================
  let allDataSheetName = null
  let allDataHeaderCols = []
  try {
    const allData = await props.chartDataQuery()
    if (allData.length) {
      allDataHeaderCols = Object.keys(allData[0])
      allDataSheetName = 'All Data'
    }
  } catch {}
  const refSheet = allDataSheetName || (props.tables.length > 0 ? sanitizeSheetName(props.tables[0].name) : null)
  const refCols = allDataSheetName ? allDataHeaderCols : (props.tables[0]?.columns || []).map(c => c.name)
  const refColLetters = {}
  refCols.forEach((c, i) => { refColLetters[c] = colLetter(i) })

  // ========================
  // CHART SHEETS (with formulas)
  // ========================
  for (const img of props.chartImages) {
    const data = img.queryResult
    if (!data || !data.length) continue
    const ws = wb.addWorksheet(sanitizeSheetName(img.title || 'Chart'))
    const keys = Object.keys(data[0])
    const chartColor = getChartTypeColor(img.chartType)

    // Colored header banner (row 1-2)
    ws.mergeCells(1, 1, 1, keys.length)
    const titleCell = ws.getCell(1, 1)
    titleCell.value = img.title || 'Chart'
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: chartColor } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(1).height = 28

    // Metadata row (row 2)
    ws.mergeCells(2, 1, 2, keys.length)
    const metaCell = ws.getCell(2, 1)
    metaCell.value = 'Type: ' + (img.chartType || '\u2014') + '  |  X: ' + (img.xCol || '\u2014') + '  |  Y: ' + (img.yCol || '\u2014') + '  |  Aggregation: ' + (img.agg || '\u2014')
    metaCell.font = { size: 10, color: { argb: 'FF64748B' }, italic: true }
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(2).height = 22

    // Data header row (row 4)
    const dataHeaderRow = 4
    ws.addRow([]) // row 3 blank
    ws.addRow(keys) // row 4 = actual header

    // Determine formula reference sheet
    const isPivotChart = img._fromPivot && img._pivotRef >= 0
    const pivotRef = isPivotChart ? img._pivotRef : -1
    const pivotDataList = cfg.pivots || []
    const pivotSheetName = isPivotChart
      ? (pivotDataList.length > 1 ? 'Pivot ' + (pivotRef + 1) : 'Pivot Data')
      : null

    let formulaRefSheet, formulaXLetter, formulaYLetter, canUseFormula

    if (isPivotChart && pivotSheetName && pivotRef < pivotDataList.length) {
      // Pivot chart: reference the Pivot Data sheet using VLOOKUP
      const pivotData = pivotDataList[pivotRef]
      formulaRefSheet = pivotSheetName
      const yIdx = (pivotData.headers || []).indexOf(img.yCol)
      if (yIdx >= 0) {
        formulaXLetter = 'A' // Row column
        formulaYLetter = colLetter(yIdx + 1) // +1 because A is 'Row'
        const lastColLetter = colLetter(pivotData.headers.length) // 0-indexed
        canUseFormula = true
        // Store info for formula construction
        img._pivotYColIdx = yIdx + 2 // 1-based column index (A=1, B=2...)
        img._pivotLastCol = lastColLetter
      } else {
        canUseFormula = false
      }
    } else {
      // Regular chart: reference All Data or first table
      formulaRefSheet = refSheet
      formulaXLetter = refColLetters[img.xCol]
      formulaYLetter = refColLetters[img.yCol]
      canUseFormula = formulaRefSheet && formulaXLetter && formulaYLetter && allDataSheetName
    }

    const agg = (img.agg || 'SUM').toUpperCase()

    // Data rows with formulas when possible, static values otherwise
    for (let ri = 0; ri < data.length; ri++) {
      const r = data[ri]
      const rowNum = dataHeaderRow + 1 + ri
      const rowData = []
      for (let ci = 0; ci < keys.length; ci++) {
        const key = keys[ci]
        if (ci === 0) {
          rowData.push(cleanValue(r[key]))
        } else if (ci === 1 && canUseFormula) {
          const xVal = r[keys[0]]
          if (xVal != null) {
            const sheet = "'" + formulaRefSheet + "'"
            let formula
            if (isPivotChart) {
              formula = 'VLOOKUP(A' + rowNum + ',' + sheet + '!A:' + img._pivotLastCol + ',' + img._pivotYColIdx + ',FALSE)'
            } else {
              const xL = formulaXLetter
              const yL = formulaYLetter
              if (agg === 'SUM') formula = 'SUMIF(' + sheet + '!' + xL + ':' + xL + ',A' + rowNum + ',' + sheet + '!' + yL + ':' + yL + ')'
              else if (agg === 'AVG') formula = 'AVERAGEIF(' + sheet + '!' + xL + ':' + xL + ',A' + rowNum + ',' + sheet + '!' + yL + ':' + yL + ')'
              else if (agg === 'MIN') formula = 'MINIFS(' + sheet + '!' + yL + ':' + yL + ',' + sheet + '!' + xL + ':' + xL + ',A' + rowNum + ')'
              else if (agg === 'MAX') formula = 'MAXIFS(' + sheet + '!' + yL + ':' + yL + ',' + sheet + '!' + xL + ':' + xL + ',A' + rowNum + ')'
              else if (agg === 'COUNT') formula = 'COUNTIF(' + sheet + '!' + xL + ':' + xL + ',A' + rowNum + ')'
              else formula = ''
            }
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

    // Style data header and cells
    const lastRow = dataHeaderRow + data.length
    const lastCol = keys.length
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(dataHeaderRow, c)
      cell.font = HEADER_FONT
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: chartColor } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    }
    ws.getRow(dataHeaderRow).height = 22

    for (let r = dataHeaderRow + 1; r <= lastRow; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(r, c)
        if (r % 2 === 0) cell.fill = ALT_ROW_FILL
        cell.border = { bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } }
        if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd'
      }
    }

    keys.forEach((k, i) => { ws.getColumn(i + 1).width = Math.max(14, Math.min(k.length * 2 + 6, 30)) })

    // Embed chart image below data
    const imgRow = lastRow + 2
    const b64 = img.dataUrl.split(',')[1]
    if (b64) {
      const imgObj = new Image()
      imgObj.src = img.dataUrl
      await new Promise(r => { imgObj.onload = r })
      const ar = imgObj.naturalHeight / imgObj.naturalWidth
      const imgW = 520
      const imgH = Math.round(imgW * ar)
      const imageId = wb.addImage({ base64: b64, extension: 'png' })
      ws.addImage(imageId, {
        tl: { col: 0, row: imgRow - 1 },
        ext: { width: imgW, height: imgH },
      })
    }
    ws.autoFilter = { from: { row: dataHeaderRow, col: 1 }, to: { row: lastRow, col: lastCol } }
    hasData = true
  }

  // ========================
  // PIVOT DATA SHEETS
  // ========================
  const pivotDataList = cfg.pivots || []
  for (let pi = 0; pi < pivotDataList.length; pi++) {
    const pivotData = pivotDataList[pi]
    if (!pivotData || !pivotData.result || !pivotData.result.length) continue
    const ws = wb.addWorksheet(pivotDataList.length > 1 ? 'Pivot ' + (pi + 1) : 'Pivot Data')
    const allHeaders = ['Row', ...pivotData.headers]
    ws.addRow(allHeaders)
    for (const row of pivotData.result) {
      ws.addRow(allHeaders.map(h => cleanValue(h === 'Row' ? row._row : row[h])))
    }
    allHeaders.forEach((h, i) => {
      const maxLen = pivotData.result.reduce((m, r) => {
        const v = h === 'Row' ? r._row : r[h]; const s = v != null ? String(v).length : 0
        return s > m ? s : m
      }, h.length)
      ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 8), 40)
    })
    const lr = pivotData.result.length + 1
    const lc = allHeaders.length
    styleHeaderRow(ws, lc)
    styleDataCells(ws, lr, lc)
    addAutoFilter(ws, lc, lr)
    hasData = true
  }

  // ========================
  // PER-TABLE DATA SHEETS
  // ========================
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

  // ========================
  // ALL DATA SHEET
  // ========================
  try {
    const allData = await props.chartDataQuery()
    if (allData.length) {
      const dataCols = Object.keys(allData[0])
      const ws = wb.addWorksheet('All Data')
      const { lastRow, lastCol, headers } = writeRows(ws, allData, dataCols)
      addAutoFilter(ws, lastCol, lastRow)
      hasData = true
    }
  } catch {}

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

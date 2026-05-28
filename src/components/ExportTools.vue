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
    <div v-if="chartImages.filter(i => i.dataUrl).length" class="border-t border-gray-200 pt-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Chart images</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="img in chartImages.filter(i => i.dataUrl)" :key="img.id" @click="downloadImage(img)"
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

    <div class="border-t border-gray-200 pt-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Excel report options</h3>
      <p class="text-xs text-gray-400 mb-4 leading-relaxed">
        Every chart and table from your canvas becomes a dedicated sheet in the workbook.
        The cover sheet includes a dashboard screenshot and summary info. Chart sheets
        include embedded chart images alongside data tables with live Excel formulas
        connected to an "All Data" reference sheet.
      </p>
      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" v-model="reportOpts.dashboard" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span>Include dashboard screenshot</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" v-model="reportOpts.charts" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span>Include chart sheets</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" v-model="reportOpts.tables" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span>Include canvas table sheets</span>
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" v-model="reportOpts.rawData" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span>Include raw data appendix (per-table)</span>
        </label>
      </div>
    </div>

    <div class="border-t border-gray-200 pt-6">
      <label class="block text-sm font-medium text-gray-600 mb-1">Excel theme</label>
      <div class="flex gap-2">
        <button v-for="(t, key) in themes" :key="key" @click="reportTheme = key"
          class="px-3 py-1.5 text-xs rounded font-medium transition-colors"
          :class="reportTheme === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
          {{ key.charAt(0).toUpperCase() + key.slice(1) }}
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
const reportDescription = ref('')
const reportOpts = ref({ dashboard: true, charts: true, tables: true, rawData: false })

const canExport = computed(() => props.rawRows.length > 0 || (props.reportConfig.charts || []).some(c => c.queryResult?.length))
const savedReports = ref(JSON.parse(localStorage.getItem('quickbi_reports') || '[]'))

const reportTheme = ref('professional')
const themes = {
  professional: { header: 'FF1F4E79', accent: 'FF3B82F6', alt: 'FFF5F7FA' },
  colorful: { header: 'FF7C3AED', accent: 'FFF59E0B', alt: 'FFFFF7ED' },
  minimal: { header: 'FF374151', accent: 'FF6B7280', alt: 'FFF9FAFB' },
}

function tFill() {
  const t = themes[reportTheme.value] || themes.professional
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: t.header } }
}
function aFill() {
  const t = themes[reportTheme.value] || themes.professional
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: t.alt } }
}

const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }

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
    cell.fill = tFill()
    cell.alignment = { vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    }
  }
    ws.getRow(1).height = 26
  }

  function styleDataCells(ws, rowCount, colCount) {
    for (let r = 2; r <= rowCount; r++) {
      ws.getRow(r).height = 20
      for (let c = 1; c <= colCount; c++) {
        const cell = ws.getCell(r, c)
        cell.font = { size: 11 }
        if (r % 2 === 0) cell.fill = aFill()
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

function getChartTypeColor(type) {
  const t = themes[reportTheme.value] || themes.professional
  const colors = { bar: t.accent, line: 'FF10B981', pie: 'FF8B5CF6', doughnut: 'FFEC4899', polarArea: 'FFF59E0B', radar: 'FF06B6D4' }
  return colors[type] || t.header
}

async function exportExcel() {
  try {
  const name = (props.reportConfig.name || 'dashboard').replace(/[^a-zA-Z0-9_-]/g, '_')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Quack BI Lite'
  wb.created = new Date()

  let hasData = false
  const cfg = props.reportConfig
  const genDate = new Date().toLocaleString()
  const desc = reportDescription.value || ''
  const opts = reportOpts.value
  const theme = themes[reportTheme.value] || themes.professional

  // ========================
  // PRE-FETCH ALL DATA (for chart formulas)
  // ========================
  let allData = []
  let allDataHeaderCols = []
  let refColLetters = {}
  try {
    allData = await props.chartDataQuery()
    if (allData.length) {
      allDataHeaderCols = Object.keys(allData[0])
      allDataHeaderCols.forEach((c, i) => { refColLetters[c] = colLetter(i) })
    }
  } catch {}
  const refSheet = 'All Data'

  // ========================
  // 1. COVER SHEET
  // ========================
  const coverWs = wb.addWorksheet('Cover')
  coverWs.getColumn(1).width = 4
  coverWs.getColumn(2).width = 80
  coverWs.getColumn(3).width = 30

  coverWs.mergeCells('B1:C1')
  coverWs.getCell('B1').value = cfg.name || 'Quack BI Report'
  coverWs.getCell('B1').font = { bold: true, size: 26, color: { argb: theme.header } }
  coverWs.getRow(1).height = 40

  if (desc) {
    coverWs.getCell('B2').value = desc
    coverWs.getCell('B2').font = { size: 12, color: { argb: 'FF64748B' }, italic: true }
    coverWs.getRow(2).height = 22
  }

  const infoRow = desc ? 4 : 3
  const chartCount = props.chartImages.filter(i => i.chartType !== 'table').length
  const tableCount = props.chartImages.filter(i => i.chartType === 'table').length
  coverWs.getCell('B' + infoRow).value = 'Generated: ' + genDate
  coverWs.getCell('B' + infoRow).font = { size: 11, color: { argb: 'FF64748B' } }
  coverWs.getCell('C' + infoRow).value = 'Data sources: ' + (cfg.tables || []).length + '  |  Charts: ' + chartCount + '  |  Tables: ' + tableCount
  coverWs.getCell('C' + infoRow).font = { size: 11, color: { argb: 'FF64748B' } }

  const divRow = infoRow + 1
  coverWs.getCell('B' + divRow).value = ''
  coverWs.getCell('B' + divRow).border = { bottom: { style: 'medium', color: { argb: theme.accent } } }
  coverWs.mergeCells('B' + divRow + ':C' + divRow)

  let coverImgRow = divRow + 2
  const dashB64 = (props.dashboardImage || '').split(',')[1]
  if (dashB64 && opts.dashboard) {
    const imgObj = new Image()
    imgObj.src = props.dashboardImage
    await new Promise(r => { imgObj.onload = r })
    const ar = imgObj.naturalHeight / imgObj.naturalWidth
    const imgW = 900
    const imgH = Math.round(imgW * ar)
    const imageId = wb.addImage({ base64: dashB64, extension: 'png' })
    coverWs.addImage(imageId, {
      tl: { col: 1, row: coverImgRow - 1 },
      ext: { width: imgW, height: imgH },
    })
    coverWs.getRow(coverImgRow).height = imgH * 0.75 + 10
    coverImgRow += Math.ceil(imgH / 15) + 2
  }

  coverWs.getCell('B' + coverImgRow).value = 'Data Sources:'
  coverWs.getCell('B' + coverImgRow).font = { bold: true, size: 11, color: { argb: theme.header } }
  coverImgRow++
  for (const t of (cfg.tables || [])) {
    const colInfo = props.tables.find(x => x.name === t.name)
    coverWs.getCell('B' + coverImgRow).value = '  \u2022 ' + t.name + ' (' + (colInfo?.rowCount ?? '?') + ' rows, ' + (colInfo?.columns?.length ?? '?') + ' columns)'
    coverWs.getCell('B' + coverImgRow).font = { size: 10, color: { argb: 'FF64748B' } }
    coverImgRow++
  }
  hasData = true

  // ========================
  // 2. DASHBOARD SHEET (full-page trimmed screenshot)
  // ========================
  if (opts.dashboard) {
    const dashWs = wb.addWorksheet('Dashboard')
    dashWs.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, margins: { top: 0.3, bottom: 0.3, left: 0.3, right: 0.3, header: 0, footer: 0 } }
    const dashFullB64 = (props.dashboardImage || '').split(',')[1]
    if (dashFullB64) {
      const imgObj = new Image()
      imgObj.src = props.dashboardImage
      await new Promise(r => { imgObj.onload = r })
      const pw = 900
      const ar = imgObj.naturalHeight / imgObj.naturalWidth
      const imgW = Math.min(pw, imgObj.naturalWidth)
      const imgH = Math.round(imgW * ar)
      const imageId = wb.addImage({ base64: dashFullB64, extension: 'png' })
      dashWs.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: imgW, height: imgH },
      })
      dashWs.getColumn(1).width = imgW / 7
      const rowSpan = Math.ceil(imgH / 15) + 1
      for (let r = 1; r <= rowSpan; r++) {
        dashWs.getRow(r).height = 15
      }
      dashWs.getRow(1).height = imgH * 0.75
    }
  }

  // ========================
  // 3. GROUP CHARTS BY SOURCE TABLE
  // ========================
  const chartImageList = props.chartImages.filter(i => i.chartType !== 'table' && i.queryResult?.length)
  const canvasTableList = props.chartImages.filter(i => i.chartType === 'table')
  const pivotDataList = cfg.pivots || []

  const tableGroups = {}
  const tableOrder = []
  for (const img of chartImageList) {
    const t = img.table || '__untagged__'
    if (!tableGroups[t]) { tableGroups[t] = []; tableOrder.push(t) }
    tableGroups[t].push(img)
  }

  // ========================
  // 4. CHART SHEETS GROUPED BY TABLE
  // ========================
  async function writeChartSheet(img) {
    const data = img.queryResult
    if (!data || !data.length) return false
    const ws = wb.addWorksheet(sanitizeSheetName(img.title || 'Chart'))
    const keys = Object.keys(data[0])
    const chartColor = getChartTypeColor(img.chartType)
    const b64 = img.dataUrl.split(',')[1]

    let dataStartRow = 1

    // Title
    ws.mergeCells(dataStartRow, 1, dataStartRow, keys.length)
    const titleCell = ws.getCell(dataStartRow, 1)
    titleCell.value = img.title || 'Chart'
    titleCell.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: chartColor } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getRow(dataStartRow).height = 36

    // If pivot chart, embed pivot data sub-table
    let dataHeaderRow = dataStartRow + 1
    const isPivotChart = img._fromPivot && img._pivotRef >= 0
    if (isPivotChart && img._pivotRef < pivotDataList.length) {
      const pivotData = pivotDataList[img._pivotRef]
      if (pivotData && pivotData.result && pivotData.result.length) {
        const pivotHeader = dataHeaderRow
        const allPivotHeaders = ['Row', ...(pivotData.headers || [])]
        ws.addRow([])
        dataHeaderRow++
        ws.getCell(dataHeaderRow, 1).value = 'Pivot Data: ' + (pivotData.rowCol || '') + ' x ' + (pivotData.colCol || '')
        ws.getCell(dataHeaderRow, 1).font = { bold: true, size: 10, color: { argb: 'FF374151' } }
        ws.mergeCells(dataHeaderRow, 1, dataHeaderRow, allPivotHeaders.length)
        dataHeaderRow++
        ws.addRow(allPivotHeaders)
        for (const prow of pivotData.result) {
          ws.addRow(allPivotHeaders.map(h => cleanValue(h === 'Row' ? prow._row : prow[h])))
        }
        allPivotHeaders.forEach((h, i) => {
          const cell = ws.getCell(dataHeaderRow, i + 1)
          cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B7280' } }
          cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
        })
        const pivotLastRow = dataHeaderRow + pivotData.result.length
        const pivotLastCol = allPivotHeaders.length
        for (let r = dataHeaderRow + 1; r <= pivotLastRow; r++) {
          for (let c = 1; c <= pivotLastCol; c++) {
            ws.getCell(r, c).border = { bottom: { style: 'hair' } }
          }
        }
        dataHeaderRow = pivotLastRow + 2
      }
    }

    // Data header
    ws.getCell(dataHeaderRow, 1).value = ''
    ws.addRow([])
    dataHeaderRow++
    ws.addRow(keys)

    // Formula reference
    const pivotSheetName = isPivotChart
      ? (pivotDataList.length > 1 ? 'Pivot ' + (img._pivotRef + 1) : 'Pivot Data')
      : null

    let formulaRefSheet, formulaXLetter, formulaYLetter, canUseFormula

    if (isPivotChart && pivotSheetName && img._pivotRef < pivotDataList.length) {
      const pivotData = pivotDataList[img._pivotRef]
      formulaRefSheet = pivotSheetName
      const yIdx = (pivotData.headers || []).indexOf(img.yCol)
      if (yIdx >= 0) {
        formulaXLetter = 'A'
        formulaYLetter = colLetter(yIdx + 1)
        const lastColLetter = colLetter(pivotData.headers.length)
        canUseFormula = true
        img._pivotYColIdx = yIdx + 2
        img._pivotLastCol = lastColLetter
      } else {
        canUseFormula = false
      }
    } else {
      formulaRefSheet = refSheet
      formulaXLetter = refColLetters[img.xCol]
      formulaYLetter = refColLetters[img.yCol]
      canUseFormula = formulaRefSheet && formulaXLetter && formulaYLetter && allData.length > 0
    }

    const agg = (img.agg || 'SUM').toUpperCase()

    // Data rows with formulas
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

    // Style data header
    const dataLastRow = dataHeaderRow + data.length
    const lastCol = keys.length
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getCell(dataHeaderRow, c)
      cell.font = HEADER_FONT
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: chartColor } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    }
    ws.getRow(dataHeaderRow).height = 26

    for (let r = dataHeaderRow + 1; r <= dataLastRow; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(r, c)
        if (r % 2 === 0) cell.fill = aFill()
        cell.border = { bottom: { style: 'hair' }, left: { style: 'hair' }, right: { style: 'hair' } }
        if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd'
      }
    }

    keys.forEach((k, i) => {
      if (ws.getColumn(i + 1).width < 14) {
        ws.getColumn(i + 1).width = Math.max(14, Math.min(k.length * 2 + 6, 30))
      }
    })
    ws.autoFilter = { from: { row: dataHeaderRow, col: 1 }, to: { row: dataLastRow, col: lastCol } }

    // Chart image below data
    if (b64) {
      const imgObj = new Image()
      imgObj.src = img.dataUrl
      await new Promise(r => { imgObj.onload = r })
      const ar = imgObj.naturalHeight / imgObj.naturalWidth
      const imgW = Math.min(900, imgObj.naturalWidth)
      const imgH = Math.round(imgW * ar)
      const imageId = wb.addImage({ base64: b64, extension: 'png' })
      ws.addImage(imageId, {
        tl: { col: 0, row: dataLastRow + 2 },
        ext: { width: imgW, height: imgH },
      })
      ws.getColumn(1).width = Math.max(25, imgW / 6)
    }
    return true
  }

  if (opts.charts) {
    for (const tableName of tableOrder) {
      // Raw data sheet for this table (opt-in)
      if (opts.rawData && tableName !== '__untagged__') {
        const tableInfo = props.tables.find(t => t.name === tableName)
        if (tableInfo) {
          try {
            const allRows = await props.fetchFullTable(tableName)
            if (allRows.length) {
              const ws = wb.addWorksheet(sanitizeSheetName(tableName))
              const { lastRow, lastCol } = writeRows(ws, allRows, tableInfo.columns)
              addAutoFilter(ws, lastCol, lastRow)
              hasData = true
            }
          } catch {}
        }
      }
      // Chart sheets for this table
      for (const img of tableGroups[tableName]) {
        if (await writeChartSheet(img)) hasData = true
      }
    }

    // Untagged chart sheets at the end (no source table)
    if (tableGroups['__untagged__']) {
      for (const img of tableGroups['__untagged__']) {
        if (await writeChartSheet(img)) hasData = true
      }
    }
  }

  // ========================
  // 5. CANVAS TABLE SHEETS
  // ========================
  if (opts.tables) {
    for (const item of canvasTableList) {
      if (!item.queryResult || !item.queryResult.length || !item.columns) continue
      const ws = wb.addWorksheet(sanitizeSheetName(item.title || 'Data Table'))
      const { lastRow, lastCol } = writeRows(ws, item.queryResult, item.columns.map(c => ({ name: c })))
      addAutoFilter(ws, lastCol, lastRow)
      hasData = true
    }
  }

  // ========================
  // 6. PIVOT DATA SHEETS
  // ========================
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
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 10), 60)
    })
    const lr = pivotData.result.length + 1
    const lc = allHeaders.length
    styleHeaderRow(ws, lc)
    styleDataCells(ws, lr, lc)
    addAutoFilter(ws, lc, lr)
    hasData = true
  }

  // ========================
  // 7. RAW DATA APPENDIX (opt-in, remaining untagged tables)
  // ========================
  if (opts.rawData) {
    for (const table of props.tables) {
      if (tableGroups[table.name]) continue
      try {
        const allRows = await props.fetchFullTable(table.name)
        if (!allRows.length) continue
        const ws = wb.addWorksheet(sanitizeSheetName(table.name))
        const { lastRow, lastCol } = writeRows(ws, allRows, table.columns)
        addAutoFilter(ws, lastCol, lastRow)
        hasData = true
      } catch {}
    }
  }

  // ========================
  // 8. ALL DATA SHEET (for formula references)
  // ========================
  if (allData.length) {
    const dataCols = Object.keys(allData[0])
    const ws = wb.addWorksheet('All Data')
    const { lastRow, lastCol } = writeRows(ws, allData, dataCols)
    addAutoFilter(ws, lastCol, lastRow)
    hasData = true
  }

  if (!hasData) { showMessage('No data to export.', 'error'); return }

  wb.eachSheet(ws => {
    if (ws.name !== 'Dashboard' && ws.name !== 'Cover') {
      ws.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5, header: 0.3, footer: 0.3 } }
    }
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name + '.xlsx'; a.click()
  URL.revokeObjectURL(url)
  showMessage('Excel workbook with charts downloaded!')
  } catch (err) { showMessage('Export failed: ' + (err.message || err), 'error') }
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
    if (!img.dataUrl) continue
    doc.addPage('l', 'mm')
    const pw = 297, ph = 210
    const imgW = pw - margin * 2
    let y = margin

    doc.setFontSize(14)
    doc.text(img.title || 'Chart', margin, y)
    y += 8

    doc.setFontSize(9)
    doc.text('Type: ' + (img.chartType || '') + ' | X: ' + (img.xCol || '') + ' | Y: ' + (img.yCol || '') + ' | Aggregation: ' + (img.agg || ''), margin, y)
    y += 6

    const imgH = 80
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
        if (y > ph - margin) break
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
    const b64 = (img.dataUrl || '').split(',')[1]
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

import { ref, computed, watch } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend } from 'chart.js'
import mvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import ehWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import coiWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url'
import mvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import coiWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url'
import coiPthreadWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url'
import { gridModel } from './konvaGridModel'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend)

let db = null
let conn = null
let idCounter = 0
const timers = {}
const usedTableNames = new Set()
const bgColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

const currentStep = ref(1)
const tables = ref([])
const charts = ref([])
const canvasTables = ref([])
const texts = ref([])
const joins = ref([])
const showJoinConfig = ref(false)
const viewOnly = ref(false)
const capturedImages = ref([])
const capturedDashboardImage = ref(null)
const capturedGridData = ref([])
const showAbout = ref(false)
const loadingSamples = ref(false)
const dashboardName = ref('My Report')
const sharedPivots = ref([])

export function useDashboard() {
  const allColumns = computed(() => tables.value.flatMap(t => t.columns))

  const allNumericCols = computed(() => allColumns.value.filter(c =>
    ['INTEGER', 'DOUBLE', 'BIGINT', 'FLOAT', 'DECIMAL', 'HUGEINT', 'SMALLINT', 'TINYINT'].some(t => c.type.toUpperCase().includes(t))
  ))

  const allRows = computed(() => {
    if (!tables.value.length) return []
    return tables.value[0]?.rows || []
  })

  const joinSvgW = computed(() => Math.max(400, joins.value.length * 28 + 60))

  const exploreSchemaText = computed(() => {
    if (!tables.value.length) return ''
    let s = tables.value.map(t => {
      const cols = t.columns.map(c => c.name + ' (' + c.type + ')').join(', ')
      return 'Table: ' + t.name + '\nColumns: ' + cols
    }).join('\n\n')
    if (joins.value.length) {
      s += '\n\nJoins:\n' + joins.value.map(j =>
        j.table1 + '.' + j.col1 + ' = ' + j.table2 + '.' + j.col2 + ' (' + j.type + ')'
      ).join('\n')
    }
    return s
  })

  const chartSuggestions = computed(() => {
    const cats = allColumns.value.filter(c => !allNumericCols.value.includes(c))
    const nums = allNumericCols.value
    if (!cats.length || !nums.length) return []
    const firstTable = tables.value[0]?.name || ''
    const dateCols = cats.filter(c => c.type.toUpperCase().includes('DATE') || c.name.toLowerCase().includes('date'))
    const suggestions = []
    if (cats[0] && nums[0]) suggestions.push({ label: cats[0].name + ' by ' + nums[0].name, xCol: cats[0].name, yCol: nums[0].name, agg: 'SUM', chartType: 'bar', table: firstTable })
    if (dateCols.length && nums[0]) suggestions.push({ label: nums[0].name + ' over time', xCol: dateCols[0].name, yCol: nums[0].name, agg: 'SUM', chartType: 'line', table: firstTable })
    if (cats.length > 1) suggestions.push({ label: 'Distribution of ' + cats[1].name, xCol: cats[1].name, yCol: nums[0].name, agg: 'SUM', chartType: 'pie', table: firstTable })
    if (cats.length > 2 && nums.length > 1) suggestions.push({ label: cats[2].name + ' by ' + nums[1].name, xCol: cats[2].name, yCol: nums[1].name, agg: 'AVG', chartType: 'bar', table: firstTable })
    if (dateCols.length && nums.length > 1) suggestions.push({ label: 'Avg ' + nums[1].name + ' over time', xCol: dateCols[0].name, yCol: nums[1].name, agg: 'AVG', chartType: 'line', table: firstTable })
    return suggestions.slice(0, 6)
  })

  const reportConfig = computed(() => ({
    name: dashboardName.value,
    tables: tables.value.map(t => ({ name: t.name, fileName: t.fileName })),
    joins: joins.value,
    charts: charts.value.map(c => ({
      id: c.id, title: c.title, xCol: c.xCol, yCol: c.yCol,
      agg: c.agg, chartType: c.chartType, sortDir: c.sortDir,
      limit: c.limit, filter: c.filter, table: c.table,
      x: c.x, y: c.y, width: c.width, height: c.height,
      queryResult: c.queryResult, resultColumns: c.resultColumns,
      cellRange: c.cellRange || null,
    })),
    texts: texts.value.map(t => ({ id: t.id, text: t.text, x: t.x, y: t.y, fontSize: t.fontSize, bold: t.bold, color: t.color })),
    canvasTables: canvasTables.value.map(t => ({
      id: t.id, title: t.title, tableName: t.tableName,
      displayColumns: t.displayColumns, sortCol: t.sortCol,
      sortDir: t.sortDir, filter: t.filter, limit: t.limit,
      x: t.x, y: t.y, width: t.width, height: t.height,
      rows: t.rows, queryResult: t.queryResult, cellFormats: t.cellFormats,
    })),
    pivots: sharedPivots.value.map(p => ({ rowCol: p.rowCol, colCol: p.colCol, valCol: p.valCol, agg: p.agg, result: p.result, headers: p.headers })),
    gridData: capturedGridData.value,
  }))

  function uid() { return (Date.now() + ++idCounter).toString(36) }

  function cleanValue(v) {
    if (v == null) return null
    if (typeof v === 'bigint') return Number(v)
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const t = v.trim()
      if (t.startsWith('"') && t.endsWith('"')) return cleanValue(t.slice(1, -1))
      if (t !== '' && !isNaN(Number(t))) return Number(t)
      if (t === '' || t === '-' || t === '\u2014') return null
      return t
    }
    return v
  }

  function toPlain(rows) {
    return rows.map(r => {
      const obj = {}
      for (const key of Object.keys(r)) { obj[key] = cleanValue(r[key]) }
      return obj
    })
  }

  function canNavigateTo(step) {
    if (step === 1) return true
    if (step === 2) return tables.value.length > 0
    if (step === 3) return tables.value.length > 0
    if (step === 4) return charts.value.length > 0
    return false
  }

  function stepButtonClass(step) {
    if (currentStep.value === step) return 'bg-blue-600 text-white shadow-sm'
    if (canNavigateTo(step)) return 'text-gray-600 hover:bg-gray-100'
    return 'text-gray-300 cursor-not-allowed'
  }

  function stepBadgeClass(step) {
    if (currentStep.value === step) return 'bg-white text-blue-600'
    if (currentStep.value > step) return 'bg-green-500 text-white'
    if (canNavigateTo(step)) return 'bg-gray-200 text-gray-500'
    return 'bg-gray-100 text-gray-300'
  }

  async function captureAllContent() {
    capturedImages.value = []

    const rangeBased = charts.value.filter(c => c.cellRange?.data)
    for (const c of rangeBased) {
      if (!capturedImages.value.some(img => img.id === c.id)) {
        capturedImages.value.push({
          id: c.id,
          dataUrl: null,
          title: c.title,
          chartType: c.chartType,
          agg: c.cellRange ? 'RANGE' : (c.agg || 'SUM'),
          yCol: '',
          xCol: '',
          queryResult: null,
          cellRange: c.cellRange,
        })
      }
    }

    capturedGridData.value = gridModel.getExportData()
  }

  async function goToStep(step) {
    if (!canNavigateTo(step)) return
    if (step === 4) await captureAllContent()
    currentStep.value = step
  }

  async function goToExport() {
    if (currentStep.value === 1) { currentStep.value = 2; return }
    if (currentStep.value === 2) { currentStep.value = 3; return }
    await captureAllContent()
    currentStep.value = 4
  }

  async function initDuckDB() {
    const bundles = {
      mvp: { mainModule: mvpWasmUrl, mainWorker: mvpWorkerUrl },
      eh: { mainModule: ehWasmUrl, mainWorker: ehWorkerUrl },
      coi: { mainModule: coiWasmUrl, mainWorker: coiWorkerUrl, pthreadWorker: coiPthreadWorkerUrl },
    }
    const bundle = await duckdb.selectBundle(bundles)
    const worker = new Worker(bundle.mainWorker)
    const logger = new duckdb.ConsoleLogger()
    const instance = new duckdb.AsyncDuckDB(logger, worker)
    await instance.instantiate(bundle.mainModule, bundle.pthreadWorker)
    return instance
  }

  async function handleFileUpload(file) {
    try {
      if (!db) db = await initDuckDB()
      if (!conn) conn = await db.connect()

      const baseName = file.name.replace(/\.csv$/i, '').replace(/[^a-zA-Z0-9_]/g, '_')
      let tableName = baseName
      let suffix = 1
      while (usedTableNames.has(tableName)) { tableName = baseName + '_' + suffix; suffix++ }
      usedTableNames.add(tableName)

      const buf = new Uint8Array(await file.arrayBuffer())
      await db.registerFileBuffer(file.name, buf)
      await conn.insertCSVFromPath(file.name, { name: tableName, detect: true })

      const info = await conn.query('DESCRIBE ' + tableName)
      const cols = info.toArray().map(r => ({ name: r.column_name, type: r.column_type }))

      const preview = await conn.query('SELECT * FROM ' + tableName + ' LIMIT 50')
      const rows = toPlain(preview.toArray())

      const countRes = await conn.query('SELECT COUNT(*) AS cnt FROM ' + tableName)
      const rowCount = Number(countRes.toArray()[0].cnt)

      tables.value = [...tables.value, { name: tableName, fileName: file.name, columns: cols, rows, rowCount }]
    } catch (err) {
      console.error(err)
      const { useToast: ut } = await import('./toast')
      ut().showToast('Could not read the file ' + file.name, 'error')
    }
  }

  function removeTable(name) {
    tables.value = tables.value.filter(t => t.name !== name)
    joins.value = joins.value.filter(j => j.table1 !== name && j.table2 !== name)
  }

  async function loadSampleData() {
    loadingSamples.value = true
    const base = import.meta.env.BASE_URL || '/'
    const files = ['sales.csv', 'products.csv', 'employees.csv']
    for (const f of files) {
      try {
        const resp = await fetch(base + 'test_data/' + f)
        const blob = await resp.blob()
        const file = new File([blob], f, { type: 'text/csv' })
        await handleFileUpload(file)
      } catch (err) {
        console.error('Could not load sample file:', f, err)
      }
    }
    loadingSamples.value = false
  }

  function addJoin() {
    if (tables.value.length < 2) return
    joins.value = [...joins.value, { table1: tables.value[0].name, col1: '', type: 'INNER', table2: tables.value[1].name, col2: '' }]
  }

  function updateJoin(index, key, value) {
    joins.value = joins.value.map((j, i) => i === index ? { ...j, [key]: value } : j)
  }

  function removeJoin(index) {
    joins.value = joins.value.filter((_, i) => i !== index)
  }

  function buildFromClause(chartTable) {
    if (!joins.value.length) return '"' + (chartTable || (tables.value[0]?.name || 'raw_data')) + '"'
    let from = ''
    for (const j of joins.value) {
      if (!from) from = '"' + j.table1 + '"'
      from += ' ' + j.type + ' JOIN "' + j.table2 + '" ON "' + j.table1 + '"."' + j.col1 + '" = "' + j.table2 + '"."' + j.col2 + '"'
    }
    if (chartTable && !from.includes(chartTable)) {
      from = '"' + chartTable + '", ' + from
    }
    return from
  }

  function getColumns(tableName) {
    const t = tables.value.find(x => x.name === tableName)
    return t?.columns || []
  }

  async function fetchAllData() {
    if (!conn || !tables.value.length) return []
    try {
      const from = buildFromClause(tables.value[0].name)
      const res = await conn.query('SELECT * FROM ' + from + ' LIMIT 5000')
      return toPlain(res.toArray())
    } catch { return [] }
  }

  async function fetchFullTableData(tableName) {
    if (!conn) return []
    try {
      const res = await conn.query('SELECT * FROM "' + tableName + '"')
      return toPlain(res.toArray())
    } catch { return [] }
  }

  function getGridDataForExport() {
    return gridModel.getExportData()
  }

  async function captureDashboardScreenshot() {
    return null
  }

  function addTextItem() {
    const id = uid()
    texts.value = [...texts.value, { id, text: 'New label', x: 40 + texts.value.length * 20, y: 40 + texts.value.length * 20, fontSize: 14, bold: false, color: '#333', _type: 'text' }]
  }

  function onTextUpdate({ id, key, value }) {
    texts.value = texts.value.map(t => t.id === id ? { ...t, [key]: value } : t)
  }

  function removeTextItem(id) {
    texts.value = texts.value.filter(t => t.id !== id)
  }

  function addChart() {
    const offset = 20 + charts.value.length * 30
    const chart = {
      id: uid(), _type: 'chart',
      title: 'Chart ' + (charts.value.length + 1),
      table: tables.value[0]?.name || '',
      xCol: '', yCol: '', agg: 'SUM', chartType: 'bar',
      sortDir: 'DESC', limit: 50, filter: '',
      x: offset % 600, y: offset, width: 420, height: 300,
      queryResult: [], resultColumns: [], chartData: null,
      cellRange: null,
      _loading: false, _error: '',
    }
    charts.value = [...charts.value, chart]
  }

  function applySuggestion(s) {
    const offset = 20 + charts.value.length * 30
    const chart = {
      id: uid(), _type: 'chart',
      title: s.label,
      table: s.table || tables.value[0]?.name || '',
      xCol: s.xCol, yCol: s.yCol, agg: s.agg, chartType: s.chartType,
      sortDir: 'DESC', limit: 50, filter: '',
      x: offset % 600, y: offset, width: 420, height: 300,
      queryResult: [], resultColumns: [], chartData: null,
      cellRange: null,
      _loading: false, _error: '',
    }
    charts.value = [...charts.value, chart]
    setTimeout(() => runChartQuery(chart), 100)
  }

  function removeChart(id) {
    charts.value = charts.value.filter(c => c.id !== id)
  }

  function autoLayoutCharts() {
    const items = charts.value
    if (!items.length) return
    const gap = 24
    const chartW = 420
    const chartH = 300
    const margin = 20
    const cols = Math.min(Math.max(Math.floor(Math.sqrt(items.length * 1.5)), 1), 4)
    charts.value = items.map((item, i) => ({
      ...item,
      x: margin + (i % cols) * (chartW + gap),
      y: margin + Math.floor(i / cols) * (chartH + gap),
    }))
  }

  function onChartUpdate({ id, key, value }) {
    const chart = charts.value.find(c => c.id === id)
    if (!chart) return
    chart[key] = value
    if (['xCol', 'yCol', 'agg', 'sortDir', 'limit', 'filter', 'table'].includes(key)) {
      clearTimeout(timers[id])
      timers[id] = setTimeout(() => runChartQuery(chart), 400)
    }
  }

  async function runChartQuery(chart) {
    if (!chart.xCol || !chart.yCol) return
    chart._loading = true
    chart._error = ''
    try {
      const from = buildFromClause(chart.table)
      let sql = 'SELECT "' + chart.xCol + '", ' + chart.agg + '("' + chart.yCol + '") AS value FROM ' + from
      if (chart.filter) sql += ' WHERE ' + chart.filter
      sql += ' GROUP BY "' + chart.xCol + '" ORDER BY value ' + (chart.sortDir || 'DESC')
      sql += ' LIMIT ' + (chart.limit || 50)

      const res = await conn.query(sql)
      const data = toPlain(res.toArray())
      chart.queryResult = data
      chart.resultColumns = res.schema.fields.map(f => f.name)
      chart.chartData = {
        labels: data.map(r => String(r[chart.resultColumns[0]])),
        datasets: [{
          label: chart.agg + ' of ' + chart.yCol,
          data: data.map(r => r.value),
          backgroundColor: bgColors, borderColor: '#3B82F6',
        }],
      }
    } catch (err) {
      console.error(err)
      chart._error = 'Query failed. Check columns, filter, or joins.'
      chart.chartData = null
    } finally {
      chart._loading = false
    }
  }

  function addCanvasTable() {
    const offset = 20 + canvasTables.value.length * 30
    const defs = tables.value[0]?.columns || []
    const item = {
      id: uid(), _type: 'table',
      title: 'Table ' + (canvasTables.value.length + 1),
      tableName: tables.value[0]?.name || '',
      displayColumns: defs.slice(0, Math.min(5, defs.length)).map((c, i) => ({ name: c.name, width: 120 })),
      sortCol: '', sortDir: 'ASC', filter: '', limit: 100,
      x: offset % 600, y: offset, width: 480, height: 300,
      rows: [], queryResult: [], selectedCell: null, cellFormats: {},
      _loading: false, _error: '',
    }
    canvasTables.value = [...canvasTables.value, item]
    setTimeout(() => runTableQuery(item), 100)
  }

  function removeCanvasTable(id) {
    canvasTables.value = canvasTables.value.filter(t => t.id !== id)
  }

  function onTableUpdate({ id, key, value }) {
    const table = canvasTables.value.find(t => t.id === id)
    if (!table) return
    table[key] = value
    if (['tableName', 'displayColumns', 'filter', 'sortCol', 'sortDir', 'limit'].includes(key)) {
      clearTimeout(timers['t_' + id])
      timers['t_' + id] = setTimeout(() => runTableQuery(table), 400)
    }
  }

  async function runTableQuery(table) {
    if (!table.displayColumns.length) return
    table._loading = true; table._error = ''
    try {
      const from = buildFromClause(table.tableName)
      const cols = table.displayColumns.map(c => '"' + c.name + '"').join(', ')
      let sql = 'SELECT ' + cols + ' FROM ' + from
      if (table.filter) sql += ' WHERE ' + table.filter
      if (table.sortCol) sql += ' ORDER BY "' + table.sortCol + '" ' + (table.sortDir || 'ASC')
      sql += ' LIMIT ' + (table.limit || 200)
      const res = await conn.query(sql)
      const data = toPlain(res.toArray())
      table.queryResult = data
      table.rows = data.map(row => table.displayColumns.map(c => {
        const v = row[c.name]
        return v == null ? '' : String(v)
      }))
    } catch (err) {
      console.error(err)
      table._error = 'Query failed.'
      table.rows = []; table.queryResult = []
    } finally { table._loading = false }
  }

  function autoLayoutCanvas() {
    const allItems = [...charts.value, ...canvasTables.value, ...texts.value]
    if (!allItems.length) return
    const gap = 24, margin = 20
    const cols = Math.min(Math.max(Math.floor(Math.sqrt(allItems.length * 1.5)), 1), 4)
    const colW = 460
    allItems.forEach((item, i) => {
      item.x = margin + (i % cols) * (colW + gap)
      item.y = margin + Math.floor(i / cols) * 330
    })
  }

  function addPivot(data) {
    sharedPivots.value = [...sharedPivots.value, { id: uid(), ...data }]
  }

  function removePivot(index) {
    sharedPivots.value = sharedPivots.value.filter((_, i) => i !== index)
  }

  async function runSqlQuery(sql) {
    if (!conn) return []
    try {
      const res = await conn.query(sql)
      return toPlain(res.toArray())
    } catch { return [] }
  }

  async function captureAndExport() {
    await captureAllContent()
    currentStep.value = 4
  }

  function onLoadReport(config) {
    dashboardName.value = config.name || 'Imported Report'
    charts.value = (config.charts || []).map(c => ({ ...c, _type: 'chart', chartData: null, _loading: false, _error: '', cellRange: c.cellRange || null }))
    canvasTables.value = (config.canvasTables || []).map(t => ({ ...t, _type: 'table', selectedCell: null, _loading: false, _error: '' }))
    texts.value = (config.texts || []).map(t => ({ ...t, _type: 'text' }))
    if (config.joins) joins.value = config.joins
    capturedImages.value = []
    viewOnly.value = true
    currentStep.value = 3
    if (config.gridData?.length) {
      gridModel.sheets = []
      for (const gd of config.gridData) {
        const sheet = gridModel.addSheet(gd.name)
        const dataRows = gd.rows || []
        if (dataRows.length > 0) {
          const headers = dataRows[0] || []
          const rows = dataRows.slice(1)
          sheet.loadFromData(headers, rows)
        }
      }
    }
    setTimeout(() => {
      charts.value.forEach(runChartQuery)
      canvasTables.value.forEach(runTableQuery)
    }, 100)
  }

  return {
    currentStep, tables, charts, canvasTables, texts, joins,
    showJoinConfig, viewOnly, capturedImages, capturedDashboardImage,
    capturedGridData, showAbout,
    loadingSamples, dashboardName, sharedPivots, bgColors,
    allColumns, allNumericCols, allRows, joinSvgW,
    exploreSchemaText, chartSuggestions, reportConfig,
    uid, cleanValue, toPlain,
    canNavigateTo, stepButtonClass, stepBadgeClass,
    goToStep, goToExport,
    initDuckDB, handleFileUpload, removeTable, loadSampleData,
    addJoin, updateJoin, removeJoin, buildFromClause, getColumns,
    fetchAllData, fetchFullTableData,
    captureDashboardScreenshot, captureAllContent,
    addTextItem, onTextUpdate, removeTextItem,
    addChart, applySuggestion, removeChart, autoLayoutCharts,
    onChartUpdate, runChartQuery,
    addCanvasTable, removeCanvasTable, onTableUpdate, runTableQuery,
    autoLayoutCanvas,
    addPivot, removePivot,
    runSqlQuery, onLoadReport, captureAndExport,
    getGridDataForExport,
  }
}

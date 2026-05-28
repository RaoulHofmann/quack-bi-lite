import { ref, computed } from 'vue'

const bgColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

const charts = ref([])
const texts = ref([])
const canvasTables = ref([])
const joins = ref([])
const sharedPivots = ref([])
const showJoinConfig = ref(false)
const viewOnly = ref(false)
const dashboardName = ref('My Report')
const capturedImages = ref([])
const capturedDashboardImage = ref(null)
let _runSqlQuery, _buildFromClause, _fetchFullTableData
let _tables, _allColumns, _allNumericCols, _getColumns, _uid
const timers = {}

export function useReport(opts) {
  if (opts) {
    _runSqlQuery = opts.runSqlQuery
    _buildFromClause = opts.buildFromClause
    _fetchFullTableData = opts.fetchFullTableData
    _tables = opts.tables
    _allColumns = opts.allColumns
    _allNumericCols = opts.allNumericCols
    _getColumns = opts.getColumns
    _uid = opts.uid
  }
  const uid = _uid
  const runSqlQuery = _runSqlQuery
  const buildFromClause = _buildFromClause
  const fetchFullTableData = _fetchFullTableData
  const tables = _tables
  const allColumns = _allColumns
  const allNumericCols = _allNumericCols
  const getColumns = _getColumns

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

  const reportConfig = computed(() => ({
    name: dashboardName.value,
    tables: tables.value.map(t => ({ name: t.name, fileName: t.fileName })),
    joins: joins.value,
    charts: charts.value.map(c => ({
      id: c.id, title: c.title, xCol: c.xCol, yCol: c.yCol,
      agg: c.agg, chartType: c.chartType, sortDir: c.sortDir,
      limit: c.limit, filter: c.filter, table: c.table,
      gridX: c.gridX, gridY: c.gridY, gridW: c.gridW, gridH: c.gridH,
      queryResult: c.queryResult, resultColumns: c.resultColumns,
      _fromPivot: c._fromPivot, _pivotHeaders: c._pivotHeaders, _pivotRef: c._pivotRef,
      _isKPI: c._isKPI || false,
    })),
    texts: texts.value.map(t => ({ id: t.id, text: t.text, gridX: t.gridX, gridY: t.gridY, gridW: t.gridW, gridH: t.gridH, fontSize: t.fontSize, bold: t.bold, color: t.color })),
    pivots: sharedPivots.value.map(p => ({ rowCol: p.rowCol, colCol: p.colCol, valCol: p.valCol, agg: p.agg, result: p.result, headers: p.headers })),
    canvasTables: canvasTables.value.map(t => ({
      id: t.id, title: t.title, tableName: t.tableName,
      columns: t.columns, sortCol: t.sortCol, sortDir: t.sortDir,
      limit: t.limit, filter: t.filter,
      gridX: t.gridX, gridY: t.gridY, gridW: t.gridW, gridH: t.gridH,
      queryResult: t.queryResult,
    })),
  }))

  function addChart() {
    const chart = {
      id: uid(), _type: 'chart',
      title: 'Chart ' + (charts.value.length + 1),
      table: tables.value[0]?.name || '',
      xCol: '', yCol: '', agg: 'SUM', chartType: 'bar',
      sortDir: 'DESC', limit: 50, filter: '',
      gridX: 0, gridY: charts.value.length, gridW: 6, gridH: 8,
      queryResult: [], resultColumns: [], chartData: null,
      _loading: false, _error: '', _isKPI: false,
    }
    charts.value = [...charts.value, chart]
  }

  function removeChart(id) {
    charts.value = charts.value.filter(c => c.id !== id)
  }

  function addCanvasTable() {
    const id = uid()
    const firstTable = tables.value[0]
    if (!firstTable) return null
    const count = charts.value.length + canvasTables.value.length
    const item = {
      id, _type: 'table',
      title: 'Table ' + (canvasTables.value.length + 1),
      tableName: firstTable.name,
      columns: firstTable.columns.map(c => c.name),
      sortCol: '', sortDir: 'DESC',
      limit: 100, filter: '',
      gridX: count % 8, gridY: count, gridW: 7, gridH: 8,
      queryResult: [], _loading: false, _error: '',
    }
    canvasTables.value = [...canvasTables.value, item]
    setTimeout(() => runCanvasTableQuery(item), 100)
    return id
  }

  function removeCanvasTable(id) {
    canvasTables.value = canvasTables.value.filter(t => t.id !== id)
  }

  function onCanvasTableUpdate({ id, key, value }) {
    const item = canvasTables.value.find(t => t.id === id)
    if (!item) return
    item[key] = value
    if (['tableName', 'columns', 'sortCol', 'sortDir', 'limit', 'filter'].some(k => k === key)) {
      clearTimeout(timers[id + '_tbl'])
      timers[id + '_tbl'] = setTimeout(() => runCanvasTableQuery(item), 400)
    }
  }

  async function runCanvasTableQuery(item) {
    if (!item.tableName || !item.columns.length) return
    item._loading = true
    item._error = ''
    try {
      let sql = 'SELECT "' + item.columns.join('", "') + '" FROM "' + item.tableName + '"'
      if (item.filter) sql += ' WHERE ' + item.filter
      if (item.sortCol) sql += ' ORDER BY "' + item.sortCol + '" ' + (item.sortDir || 'DESC')
      if (item.limit) sql += ' LIMIT ' + item.limit
      const res = await runSqlQuery(sql)
      item.queryResult = res
    } catch (err) {
      item._error = 'Query failed: ' + (err.message || err)
      item.queryResult = []
    } finally {
      item._loading = false
    }
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
      const from = buildFromClause(chart.table, joins.value, tables.value)
      let sql = 'SELECT "' + chart.xCol + '", ' + chart.agg + '("' + chart.yCol + '") AS value FROM ' + from
      if (chart.filter) sql += ' WHERE ' + chart.filter
      sql += ' GROUP BY "' + chart.xCol + '" ORDER BY value ' + (chart.sortDir || 'DESC')
      sql += ' LIMIT ' + (chart.limit || 50)

      const res = await runSqlQuery(sql)
      chart.queryResult = res
      chart.resultColumns = res.length ? Object.keys(res[0]) : []
      if (chart.resultColumns.length >= 2) {
        chart.chartData = {
          labels: res.map(r => String(r[chart.resultColumns[0]])),
          datasets: [{
            label: chart.agg + ' of ' + chart.yCol,
            data: res.map(r => Number(r.value ?? 0)),
            backgroundColor: bgColors, borderColor: '#3B82F6',
          }],
        }
      } else {
        chart.chartData = null
      }
    } catch (err) {
      console.error(err)
      chart._error = 'Query failed. Check columns, filter, or joins.'
      chart.chartData = null
    } finally {
      chart._loading = false
    }
  }

  function addTextItem() {
    const id = uid()
    texts.value = [...texts.value, {
      id, _type: 'text',
      text: 'New label',
      gridX: 0, gridY: texts.value.length, gridW: 3, gridH: 1,
      fontSize: 14, bold: false, color: '#333',
    }]
  }

  function onTextUpdate({ id, key, value }) {
    texts.value = texts.value.map(t => t.id === id ? { ...t, [key]: value } : t)
  }

  function removeTextItem(id) {
    texts.value = texts.value.filter(t => t.id !== id)
  }

  function applySuggestion(s) {
    const chart = {
      id: uid(), _type: 'chart',
      title: s.label,
      table: s.table || tables.value[0]?.name || '',
      xCol: s.xCol, yCol: s.yCol, agg: s.agg, chartType: s.chartType,
      sortDir: 'DESC', limit: 50, filter: '',
      gridX: 0, gridY: charts.value.length, gridW: 6, gridH: 8,
      queryResult: [], resultColumns: [], chartData: null,
      _loading: false, _error: '', _isKPI: false,
      _fromPivot: s._fromPivot || false,
      _pivotHeaders: s._pivotHeaders || null,
      _pivotRef: s._pivotRef ?? -1,
    }
    charts.value = [...charts.value, chart]
    setTimeout(() => runChartQuery(chart), 100)
  }

  async function runSqlAndNavigate(sql, goToStep) {
    goToStep(2)
    const results = await runSqlQuery(sql)
    const { useToast } = await import('../lib/toast')
    if (results.length) {
      useToast().showToast('Query returned ' + results.length + ' rows \u2014 see Explore tab')
    } else {
      useToast().showToast('Query returned no results', 'warning')
    }
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

  function addPivot(data) {
    sharedPivots.value = [...sharedPivots.value, { id: uid(), ...data }]
  }

  function removePivot(index) {
    sharedPivots.value = sharedPivots.value.filter((_, i) => i !== index)
  }

  function onLoadReport(config) {
    dashboardName.value = config.name || 'Imported Report'
    charts.value = (config.charts || []).map(c => ({ ...c, _type: 'chart', chartData: null, _loading: false, _error: '', _isKPI: c._isKPI || false }))
    texts.value = (config.texts || []).map(t => ({ ...t, _type: 'text' }))
    canvasTables.value = (config.canvasTables || []).map(t => ({ ...t, _type: 'table', _loading: false, _error: '' }))
    if (config.joins) joins.value = config.joins
    capturedImages.value = []
    viewOnly.value = true
    return () => {
      charts.value.forEach(runChartQuery)
      canvasTables.value.forEach(runCanvasTableQuery)
    }
  }

  return {
    charts, texts, canvasTables, joins, sharedPivots, showJoinConfig, viewOnly,
    dashboardName, capturedImages, capturedDashboardImage,
    chartSuggestions, exploreSchemaText, reportConfig,
    addChart, removeChart, onChartUpdate, runChartQuery,
    addCanvasTable, removeCanvasTable, onCanvasTableUpdate, runCanvasTableQuery,
    addTextItem, onTextUpdate, removeTextItem,
    applySuggestion,
    runSqlAndNavigate,
    addJoin, updateJoin, removeJoin,
    addPivot, removePivot,
    onLoadReport,
  }
}

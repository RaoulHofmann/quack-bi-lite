import { evaluateFormula, isFormula } from './formulaEngine'

export const DEFAULT_COL_WIDTH = 100
export const DEFAULT_ROW_HEIGHT = 26
export const HEADER_ROW_HEIGHT = 30
const MAX_ROWS = 10000
const MAX_COLS = 702

let idCounter = 0
function uid() { return (Date.now() + ++idCounter).toString(36) }

export class GridSheet {
  constructor(name, options = {}) {
    this.name = name
    this.id = uid()
    this.cells = new Map()
    this.colWidths = new Map()
    this.rowHeights = new Map()
    this.colCount = options.colCount || 26
    this.rowCount = options.rowCount || 100
  }

  cellKey(row, col) { return `${row},${col}` }

  getCell(row, col) {
    return this.cells.get(this.cellKey(row, col)) || null
  }

  getCellValue(row, col) {
    const c = this.getCell(row, col)
    if (!c) return ''
    return c.display != null ? c.display : (c.value != null ? c.value : '')
  }

  getCellRaw(row, col) {
    const c = this.getCell(row, col)
    return c ? c.value : ''
  }

  setCell(row, col, value) {
    if (row < 0 || col < 0 || row >= MAX_ROWS || col >= MAX_COLS) return
    const key = this.cellKey(row, col)
    if (value == null || value === '') {
      this.cells.delete(key)
      return
    }
    const formula = typeof value === 'string' && value.startsWith('=') ? value : null
    const raw = formula ? null : value
    this.cells.set(key, { value: raw, formula, display: null })
    if (formula) this.evaluateCell(row, col)
  }

  clearCell(row, col) {
    this.cells.delete(this.cellKey(row, col))
  }

  getColWidth(col) {
    return this.colWidths.get(col) ?? DEFAULT_COL_WIDTH
  }

  setColWidth(col, width) {
    this.colWidths.set(col, Math.max(30, width))
  }

  getRowHeight(row) {
    if (row === 0) return this.rowHeights.get(row) ?? HEADER_ROW_HEIGHT
    return this.rowHeights.get(row) ?? DEFAULT_ROW_HEIGHT
  }

  setRowHeight(row, height) {
    this.rowHeights.set(row, Math.max(20, height))
  }

  evaluateCell(row, col) {
    const c = this.getCell(row, col)
    if (!c || !c.formula) return
    const data = this.getDataArray(0, 0, this.rowCount - 1, this.colCount - 1)
    try {
      const result = evaluateFormula(c.formula, data)
      c.display = result != null ? String(result) : ''
    } catch {
      c.display = '#ERROR!'
    }
  }

  recalcAll() {
    const formulas = []
    for (const [key, cell] of this.cells) {
      if (cell.formula) formulas.push(key)
    }
    for (const key of formulas) {
      const [r, c] = key.split(',').map(Number)
      this.evaluateCell(r, c)
    }
  }

  getDataArray(row1, col1, row2, col2) {
    const rows = []
    for (let r = row1; r <= row2; r++) {
      const row = []
      for (let c = col1; c <= col2; c++) {
        row.push(this.getCellValue(r, c))
      }
      rows.push(row)
    }
    return rows
  }

  loadFromData(headers, rows) {
    this.cells.clear()
    this.colCount = headers.length
    this.rowCount = Math.max(rows.length + 1, 100)
    headers.forEach((h, ci) => {
      this.cells.set(this.cellKey(0, ci), { value: String(h), formula: null, display: null })
    })
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      if (!row) continue
      for (let ci = 0; ci < row.length; ci++) {
        const val = row[ci]
        if (val != null && val !== '') {
          this.cells.set(this.cellKey(ri + 1, ci), { value: val, formula: null, display: null })
        }
      }
    }
    headers.forEach((h, ci) => {
      let maxLen = String(h).length
      for (let ri = 0; ri < Math.min(rows.length, 100); ri++) {
        const v = rows[ri]?.[ci]
        if (v != null) maxLen = Math.max(maxLen, String(v).length)
      }
      this.setColWidth(ci, Math.min(Math.max(maxLen * 8 + 24, 80), 350))
    })
  }

  toExportData() {
    const maxPopRow = this._maxPopulatedRow()
    const maxPopCol = this._maxPopulatedCol()
    const rowCount = Math.max(maxPopRow + 2, this.rowCount)
    const colCount = Math.max(maxPopCol + 1, this.colCount, 1)
    const rows = []
    for (let r = 0; r < rowCount; r++) {
      const row = []
      for (let c = 0; c < colCount; c++) {
        row.push(this.getCellRaw(r, c))
      }
      rows.push(row)
    }
    return { name: this.name, rows }
  }

  _maxPopulatedRow() {
    let max = 0
    for (const key of this.cells.keys()) {
      const r = parseInt(key.split(',')[0], 10)
      if (r > max) max = r
    }
    return max
  }

  _maxPopulatedCol() {
    let max = 0
    for (const key of this.cells.keys()) {
      const c = parseInt(key.split(',')[1], 10)
      if (c > max) max = c
    }
    return max
  }
}

export class GridModel {
  constructor() {
    this.sheets = []
    this.activeSheetIndex = 0
    this.activeCell = null
    this.selectionRange = null
    this.chartAnchors = []
    this._listeners = new Map()
  }

  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set())
    this._listeners.get(event).add(callback)
    return () => this._listeners.get(event)?.delete(callback)
  }

  _emit(event, data) {
    this._listeners.get(event)?.forEach(fn => fn(data))
  }

  addSheet(name, options) {
    const sheet = new GridSheet(name || `Sheet${this.sheets.length + 1}`, options)
    this.sheets.push(sheet)
    return sheet
  }

  getActiveSheet() {
    return this.sheets[this.activeSheetIndex] || null
  }

  setActiveSheet(index) {
    if (index >= 0 && index < this.sheets.length) {
      this.activeSheetIndex = index
      this.activeCell = null
      this.selectionRange = null
      this._emit('sheet-change', { index, sheet: this.getActiveSheet() })
    }
  }

  getSheetNames() {
    return this.sheets.map(s => s.name)
  }

  setActiveCell(row, col) {
    this.activeCell = { row, col }
    this.selectionRange = { row1: row, col1: col, row2: row, col2: col }
    this._emit('selection-change', { activeCell: this.activeCell, range: this.selectionRange })
  }

  setSelectionRange(row1, col1, row2, col2) {
    const r1 = Math.min(row1, row2), r2 = Math.max(row1, row2)
    const c1 = Math.min(col1, col2), c2 = Math.max(col1, col2)
    this.activeCell = { row: r1, col: c1 }
    this.selectionRange = { row1: r1, col1: c1, row2: r2, col2: c2 }
    this._emit('selection-change', { activeCell: this.activeCell, range: this.selectionRange })
  }

  clearSelection() {
    this.activeCell = null
    this.selectionRange = null
    this._emit('selection-change', { activeCell: null, range: null })
  }

  moveActiveCell(dRow, dCol) {
    if (!this.activeCell) return
    const sheet = this.getActiveSheet()
    if (!sheet) return
    const newRow = Math.max(0, Math.min(sheet.rowCount - 1, this.activeCell.row + dRow))
    const newCol = Math.max(0, Math.min(sheet.colCount - 1, this.activeCell.col + dCol))
    this.setActiveCell(newRow, newCol)
  }

  addChartAnchor(chartId, anchorRow, anchorCol, options = {}) {
    const existing = this.chartAnchors.findIndex(a => a.chartId === chartId)
    const anchor = {
      chartId,
      sheetIndex: this.activeSheetIndex,
      anchorCell: { row: anchorRow, col: anchorCol },
      ...options,
    }
    if (existing >= 0) this.chartAnchors[existing] = anchor
    else this.chartAnchors.push(anchor)
    this._emit('chart-anchor-change', { chartId, anchor })
  }

  removeChartAnchor(chartId) {
    this.chartAnchors = this.chartAnchors.filter(a => a.chartId !== chartId)
  }

  getChartAnchor(chartId) {
    return this.chartAnchors.find(a => a.chartId === chartId) || null
  }

  setCellValue(row, col, value) {
    const sheet = this.getActiveSheet()
    if (!sheet) return
    sheet.setCell(row, col, value)
    this._emit('cell-change', { row, col, value, sheetIndex: this.activeSheetIndex })
  }

  clearCell(row, col) {
    const sheet = this.getActiveSheet()
    if (!sheet) return
    sheet.clearCell(row, col)
    this._emit('cell-change', { row, col, value: null, sheetIndex: this.activeSheetIndex })
  }

  getSelectedRangeData() {
    const sheet = this.getActiveSheet()
    if (!sheet || !this.selectionRange) return null
    const { row1, col1, row2, col2 } = this.selectionRange
    return sheet.getDataArray(row1, col1, row2, col2)
  }

  getActiveCellValue() {
    if (!this.activeCell) return ''
    const sheet = this.getActiveSheet()
    if (!sheet) return ''
    return sheet.getCellValue(this.activeCell.row, this.activeCell.col)
  }

  getActiveCellRaw() {
    if (!this.activeCell) return ''
    const sheet = this.getActiveSheet()
    if (!sheet) return ''
    return sheet.getCellRaw(this.activeCell.row, this.activeCell.col)
  }

  initFromTables(tables, joinedData = null, pivots = []) {
    this.sheets = []
    for (const t of tables) {
      const sheet = this.addSheet(t.name)
      const headers = t.columns.map(c => c.name)
      const rows = t.rows.map(r => t.columns.map(c => r[c.name]))
      sheet.loadFromData(headers, rows)
    }
    if (joinedData && joinedData.length) {
      const sheet = this.addSheet('Joined Data')
      const headers = Object.keys(joinedData[0])
      const rows = joinedData.map(r => headers.map(h => r[h]))
      sheet.loadFromData(headers, rows)
    }
    if (pivots && pivots.length) {
      for (let pi = 0; pi < pivots.length; pi++) {
        const p = pivots[pi]
        if (!p.result || !p.result.length) continue
        const sheet = this.addSheet(`Pivot ${pi + 1}`)
        const headers = ['Row', ...(p.headers || [])]
        const rows = p.result.map(r => headers.map(h => h === 'Row' ? r._row : r[h]))
        sheet.loadFromData(headers, rows)
      }
    }
    if (this.sheets.length > 0) {
      this.activeSheetIndex = 0
    }
    this._emit('model-init', { sheetCount: this.sheets.length })
  }

  getExportData() {
    return this.sheets.map(s => s.toExportData())
  }

  static colLetter(n) {
    if (n < 0) return ''
    let s = ''
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s
      n = Math.floor(n / 26) - 1
    }
    return s
  }

  static cellAddress(row, col) {
    return `${GridModel.colLetter(col)}${row + 1}`
  }

  static parseCellAddress(address) {
    const m = String(address).match(/^([A-Z]+)(\d+)$/i)
    if (!m) return null
    const col = GridModel._colIndex(m[1].toUpperCase())
    const row = parseInt(m[2], 10) - 1
    return { row, col }
  }

  static _colIndex(letters) {
    let result = 0
    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 64)
    }
    return result - 1
  }
}

export const gridModel = new GridModel()

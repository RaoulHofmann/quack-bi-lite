<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-3 shrink-0">
      <div class="max-w-[1600px] mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$emit('close')" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <span class="text-sm font-bold text-gray-800">Handsontable Demo</span>
          <span class="text-xs text-gray-400">v{{ hotVersion }}</span>
          <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">non-commercial &amp; evaluation</span>
        </div>
        <div class="flex items-center gap-2">
          <select v-model="selectedTable" @change="loadTable(selectedTable)" class="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white">
            <option v-for="t in availableTables" :key="t" :value="t">{{ t }}</option>
          </select>
          <button @click="loadSampleData" class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium">Load sample data</button>
          <button @click="addExampleFormula" class="text-xs border border-purple-300 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-50 font-medium">+ Formula demo</button>
        </div>
      </div>
    </header>

    <FormulaBar
      :active-cell-address="activeCellAddress"
      :formula-value="formulaValue"
      @update-formula="onFormulaUpdate"
      @accept-formula="onFormulaAccept"
    />

    <div class="flex-1 min-h-0 relative">
      <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-gray-400">
          <p class="text-lg font-medium mb-2">No data loaded</p>
          <p class="text-sm">Click <strong>Load sample data</strong> to populate the grid with CSV data.</p>
        </div>
      </div>
      <div v-show="hasData" ref="hotContainer" class="absolute inset-0" />
    </div>

    <div v-if="hasData" class="bg-white border-t border-gray-200 px-4 py-1.5 text-xs text-gray-500 flex items-center gap-4 shrink-0">
      <span>Table: <strong>{{ selectedTable }}</strong></span>
      <span>Rows: <strong>{{ rowCount }}</strong></span>
      <span>Cols: <strong>{{ colCount }}</strong></span>
      <span v-if="activeCellAddress" class="text-gray-400">|</span>
      <span v-if="activeCellAddress">Cell: <strong>{{ activeCellAddress }}</strong></span>
      <span v-if="cellValue">Value: <strong>{{ cellValue }}</strong></span>
      <span v-if="selectionRange && selectionRange !== activeCellAddress" class="text-gray-400">|</span>
      <span v-if="selectionRange && selectionRange !== activeCellAddress">Range: <strong>{{ selectionRange }}</strong></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Handsontable from 'handsontable'
import { mainTheme, reinitTheme } from 'handsontable/themes'
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import 'handsontable/styles/ht-icons-main.min.css'

reinitTheme('main', mainTheme)
import FormulaBar from './FormulaBar.vue'
import { evaluateFormula, isFormula } from '../lib/formulaEngine'

const emit = defineEmits(['close'])

const hotContainer = ref(null)
const selectedTable = ref('')
const availableTables = ref([])
const hasData = ref(false)
const rowCount = ref(0)
const colCount = ref(0)
const activeCellAddress = ref('')
const formulaValue = ref('')
const selectionRange = ref('')
const cellValue = ref('')
const hotVersion = Handsontable.version

let hotInstance = null
let currentHeaders = []
let formulas = new Map()

function colLetter(n) {
  let s = ''
  while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1 }
  return s
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(line => {
    return parseCSVLine(line).map(v => {
      if (v === '' || v === '-' || v === '\u2014') return null
      const num = Number(v)
      return isNaN(num) ? v : num
    })
  })
  return { headers, rows }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

async function loadTable(name) {
  if (!name) return

  const base = import.meta.env.BASE_URL || '/'
  try {
    const resp = await fetch(base + 'test_data/' + name)
    const text = await resp.text()
    const { headers, rows } = parseCSV(text)
    currentHeaders = headers
    formulas = new Map()

    selectedTable.value = name
    const data = rows

    if (hotInstance) {
      hotInstance.updateSettings({ data, colHeaders: headers }, false)
      hotInstance.render()
    } else {
      await nextTick()
      initHandsontable(data, headers)
    }
    hasData.value = true
    updateStatusBar()
  } catch (err) {
    console.error('Failed to load:', name, err)
  }
}

function initHandsontable(data, headers) {
  const container = hotContainer.value
  if (!container) return

  hotInstance = new Handsontable(container, {
    data,
    colHeaders: headers,
    rowHeaders: true,
    licenseKey: 'non-commercial-and-evaluation',
    theme: 'main',
    contextMenu: ['row_above', 'row_below', 'col_left', 'col_right', 'remove_row', 'remove_col', 'alignment', 'copy', 'cut'],
    fillHandle: {
      direction: 'vertical',
      autoInsertRow: false,
    },
    manualColumnResize: true,
    manualRowResize: true,
    columnSorting: true,
    filters: true,
    dropdownMenu: ['filter_by_condition', 'filter_by_value', 'filter_action_bar'],
    autoWrapRow: true,
    autoWrapCol: true,
    enterMoves: { row: 1, col: 0 },
    tabMoves: { row: 0, col: 1 },
    wordWrap: false,
    multiColumnSorting: true,
    copyPaste: true,
    height: '100%',
    width: '100%',

    afterChange(changes, source) {
      if (!changes || source === 'loadData') return

      let needsRender = false
      for (const [row, col, prevVal, newVal] of changes) {
        if (typeof newVal === 'string' && newVal.startsWith('=')) {
          const key = `${row},${col}`
          formulas.set(key, newVal)
          const dataArr = hotInstance.getData()
          const result = evaluateFormula(newVal, dataArr)
          if (result !== newVal && !String(result).startsWith('=')) {
            hotInstance.setDataAtCell(row, col, result, 'formula')
            needsRender = true
          }
        } else if (source === 'edit') {
          const key = `${row},${col}`
          if (formulas.has(key) && newVal !== formulas.get(key)) {
            formulas.delete(key)
          }
        }
      }

      updateStatusBar()
    },

    afterSelection(r1, c1, r2, c2) {
      const dataArr = hotInstance?.getData() || []
      if (r1 >= 0 && c1 >= 0 && dataArr[r1] && dataArr[r1][c1] !== undefined) {
        const val = dataArr[r1][c1]
        const key = `${r1},${c1}`
        activeCellAddress.value = `${colLetter(c1)}${r1 + 1}`
        cellValue.value = val != null ? String(val) : ''
        if (formulas.has(key)) {
          formulaValue.value = formulas.get(key)
        } else {
          formulaValue.value = val != null ? String(val) : ''
        }
      }
      updateStatusBar()
    },

    beforeChange(changes, source) {
      if (source !== 'edit') return
      for (const change of changes) {
        const [row, col] = change
        const key = `${row},${col}`
        if (formulas.has(key) && change[3] === undefined) {
          change[3] = formulas.get(key)
        }
      }
    },

    afterRemoveRow() { updateStatusBar() },
    afterCreateRow() { updateStatusBar() },
    afterRemoveCol() { updateStatusBar() },
    afterCreateCol() { updateStatusBar() },
  })
}

function updateStatusBar() {
  if (!hotInstance) return
  const data = hotInstance.getData()
  rowCount.value = data.length
  colCount.value = data[0]?.length || 0

  const sel = hotInstance.getSelected()
  if (sel && sel[0]) {
    const [r1, c1, r2, c2] = sel[0]
    if (r1 === r2 && c1 === c2) {
      selectionRange.value = `${colLetter(c1)}${r1 + 1}`
    } else {
      const top = Math.min(r1, r2)
      const left = Math.min(c1, c2)
      const bottom = Math.max(r1, r2)
      const right = Math.max(c1, c2)
      selectionRange.value = `${colLetter(left)}${top + 1}:${colLetter(right)}${bottom + 1}`
    }
  } else {
    selectionRange.value = ''
  }
}

async function loadSampleData() {
  const base = import.meta.env.BASE_URL || '/'
  const files = ['sales.csv', 'products.csv', 'employees.csv']
  availableTables.value = files
  selectedTable.value = files[0]
  await loadTable(files[0])
}

function onFormulaUpdate(val) {
  formulaValue.value = val
}

function onFormulaAccept() {
  if (!hotInstance || !formulaValue.value) return
  const sel = hotInstance.getSelected()
  if (!sel || !sel[0]) return
  const [row, col] = [sel[0][0], sel[0][1]]
  hotInstance.setDataAtCell(row, col, formulaValue.value)
}

function addExampleFormula() {
  if (!hotInstance) return
  const data = hotInstance.getData()
  const row = data.length
  const salesCol = currentHeaders.indexOf('Sales')
  const qtyCol = currentHeaders.indexOf('Quantity')
  const totalCol = currentHeaders.length

  if (salesCol === -1 || qtyCol === -1) {
    loadTable('sales.csv')
    return
  }

  hotInstance.alter('insert_col_end', 1)
  currentHeaders.push('Total')
  hotInstance.updateSettings({ colHeaders: currentHeaders })
  hotInstance.render()

  for (let r = 0; r < data.length; r++) {
    const salesVal = data[r][salesCol]
    const qtyVal = data[r][qtyCol]
    if (typeof salesVal === 'number' && typeof qtyVal === 'number') {
      const result = salesVal * qtyVal
      hotInstance.setDataAtCell(r, totalCol, result)
    }
  }
  hotInstance.setDataAtCell(row, 0, '')
}

onMounted(async () => {
  await loadSampleData()
})

onBeforeUnmount(() => {
  if (hotInstance) {
    hotInstance.destroy()
    hotInstance = null
  }
})
</script>

<style>
.handsontable .htCore td {
  font-size: 12px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
  padding: 2px 6px;
}
.handsontable .htCore th {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  background: #f3f4f6;
  border-color: #e5e7eb;
}
.handsontable .htCore .current {
  background: #e8f0fe !important;
}
.handsontable .htCore .highlight {
  background: #e8f0fe !important;
}
.handsontable .wtBorder {
  background-color: #3b82f6 !important;
}
.handsontable .htContextMenu table tbody td {
  font-size: 12px;
}
.handsontable .changeType {
  border-color: #e5e7eb;
}
.handsontable .htFiltersMenuLabel {
  font-size: 11px;
}
</style>

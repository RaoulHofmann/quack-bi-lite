<template>
  <div class="flex flex-col h-full bg-white" style="min-height:500px">
    <SpreadsheetToolbar
      :active-sheet="activeSheet"
      :sheet-count="sheets.length"
      @toggle-view="$emit('toggle-view')"
      @add-chart="openChartDialog"
      @add-table="openTableDialog"
      @add-text="$emit('add-text')"
      @auto-layout="$emit('auto-layout')"
    />

    <FormulaBar
      ref="formulaBarRef"
      :active-cell-address="activeCellAddress"
      :formula-value="formulaValue"
      @update-formula="onFormulaUpdate"
      @accept-formula="acceptFormula"
    />

    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col min-w-0">
        <div ref="gridContainer" class="flex-1 overflow-auto spreadsheet-grid"></div>

        <div class="flex items-center border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 gap-4 shrink-0">
          <span class="font-medium text-gray-700">{{ activeSheetName || 'No sheet' }}</span>
          <span v-if="selectedRangeSummary" class="text-gray-400">{{ selectedRangeSummary }}</span>
          <span v-if="activeCellValue" class="text-gray-400">Value: {{ activeCellValue }}</span>
          <span class="ml-auto text-gray-400">{{ rowsCount }} rows &times; {{ colsCount }} cols</span>
        </div>
      </div>

      <div v-if="chartDialogOpen" class="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">New Chart</h3>
          <button @click="chartDialogOpen = false" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <p class="text-xs text-gray-500">Select a range on the spreadsheet, then configure your chart.</p>

          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Data source</label>
            <select v-model="chartDraft.sourceType" class="w-full border rounded-md p-1.5 text-sm bg-white">
              <option value="range">Cell range</option>
              <option value="query">DuckDB query</option>
            </select>
          </div>

          <div v-if="chartDraft.sourceType === 'range'">
            <label class="text-xs font-medium text-gray-500 mb-1 block">Selected range</label>
            <input :value="chartDraft.range" readonly class="w-full border rounded-md p-1.5 text-sm bg-gray-50 font-mono" />
            <button @click="refreshSelectedRange" class="mt-1 text-xs text-blue-600 hover:underline">Refresh from selection</button>
          </div>

          <div v-if="chartDraft.sourceType === 'query'">
            <label class="text-xs font-medium text-gray-500 mb-1 block">X column</label>
            <select v-model="chartDraft.xCol" class="w-full border rounded-md p-1.5 text-sm bg-white">
              <option value="">Select column</option>
              <option v-for="c in allColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>

          <div v-if="chartDraft.sourceType === 'query'">
            <label class="text-xs font-medium text-gray-500 mb-1 block">Y column</label>
            <select v-model="chartDraft.yCol" class="w-full border rounded-md p-1.5 text-sm bg-white">
              <option value="">Select column</option>
              <option v-for="c in numericColumns" :key="c.name" :value="c.name">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="text-xs font-medium text-gray-500 mb-1 block">Chart type</label>
            <select v-model="chartDraft.chartType" class="w-full border rounded-md p-1.5 text-sm bg-white capitalize">
              <option v-for="t in chartTypes" :key="t" :value="t" class="capitalize">{{ t }}</option>
            </select>
          </div>

          <div v-if="chartDraft.sourceType === 'query'">
            <label class="text-xs font-medium text-gray-500 mb-1 block">Calculation</label>
            <select v-model="chartDraft.agg" class="w-full border rounded-md p-1.5 text-sm bg-white">
              <option v-for="a in ['SUM','AVG','COUNT','MIN','MAX']" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>

          <button @click="createChart"
            class="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700"
            :disabled="!canCreateChart">
            Create Chart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

import jSuites from 'jsuites'
import 'jsuites/dist/jsuites.css'
if (typeof window !== 'undefined') { window.jSuites = jSuites }

import jss from 'jspreadsheet-ce'
import 'jspreadsheet-ce/dist/jspreadsheet.css'
import FormulaBar from './FormulaBar.vue'
import SpreadsheetToolbar from './SpreadsheetToolbar.vue'
import { useSpreadsheetState } from '../lib/spreadsheetState'

const props = defineProps({
  tables: { type: Array, default: () => [] },
  charts: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  allColumns: { type: Array, default: () => [] },
})

const emit = defineEmits(['add-chart', 'add-table', 'add-text', 'auto-layout', 'toggle-view',
  'update-spreadsheet', 'chart-from-range'])

const gridContainer = ref(null)
const formulaBarRef = ref(null)
const activeCellAddress = ref('')
const formulaValue = ref('')
const activeCellValue = ref('')
const selectedRangeSummary = ref('')
const chartDialogOpen = ref(false)
const chartDraft = ref({
  sourceType: 'range',
  range: '',
  xCol: '', yCol: '', chartType: 'bar', agg: 'SUM',
  rangeData: null, rangeSheet: '', rangeCol1: 0, rangeRow1: 0, rangeCol2: 0, rangeRow2: 0,
})
const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'polarArea', 'radar']
const sheets = ref([])

const ss = useSpreadsheetState()

const activeSheet = computed(() => ss.activeSheet.value)
const activeSheetName = computed(() => ss.sheetConfigs.value[ss.activeSheet.value]?.name || '')
const rowsCount = computed(() => {
  const data = ss.getSheetDataArray(ss.activeSheet.value)
  return data ? data.length : 0
})
const colsCount = computed(() => {
  const cfg = ss.sheetConfigs.value[ss.activeSheet.value]
  return cfg ? cfg.columns.length : 0
})

const canCreateChart = computed(() => {
  if (chartDraft.value.sourceType === 'range') return !!chartDraft.value.range
  return !!(chartDraft.value.xCol && chartDraft.value.yCol)
})

let jssInstance = null
let eventAttached = false

onMounted(async () => {
  await nextTick()
  initGrid()
})

onBeforeUnmount(() => {
  if (jssInstance) {
    try { jss.destroy(gridContainer.value) } catch {}
    jssInstance = null
  }
})

watch(() => props.tables.length, () => {
  if (props.tables.length > 0) {
    nextTick(() => initGrid())
  }
})

function initGrid() {
  if (!gridContainer.value) return
  if (jssInstance) {
    try { jss.destroy(gridContainer.value) } catch {}
    jssInstance = null
  }

  if (!props.tables.length) {
    gridContainer.value.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Upload data to get started</div>'
    return
  }

  ss.initFromTables(props.tables)
  sheets.value = ss.sheetConfigs.value

  const worksheets = ss.sheetConfigs.value.map((cfg, i) => ({
    worksheetName: cfg.name,
    data: cfg.data,
    columns: cfg.columns,
    minDimensions: [cfg.columns.length, Math.max(10, cfg.data.length + 2)],
    tableOverflow: true,
    tableWidth: '100%',
    tableHeight: '100%',
    filters: true,
    columnSorting: true,
    columnResize: true,
    rowResize: true,
    editable: true,
    allowInsertRow: true,
    allowDeleteRow: true,
    allowInsertColumn: true,
    allowDeleteColumn: true,
    wordWrap: false,
    selectionCopy: true,
  }))

  jssInstance = jss(gridContainer.value, {
    worksheets,
    allowExport: false,
    about: false,
    onchange: (instance, cell, colIndex, rowIndex, newValue, oldValue) => {
      updateFormulaBar()
    },
    onselection: (instance, col1, row1, col2, row2, origin) => {
      updateFormulaBar()
      updateSelectionSummary(col1, row1, col2, row2)
    },
    onafterchanges: (instance, changes) => {
      handleCellChanges(instance, changes)
    },
  })

  ss.setSpreadsheetInstance(jssInstance)

  if (!eventAttached) {
    eventAttached = true
  }

  updateFormulaBar()
}

function updateFormulaBar() {
  const inst = ss.getActiveInstance()
  if (!inst) {
    activeCellAddress.value = ''
    formulaValue.value = ''
    activeCellValue.value = ''
    return
  }
  try {
    const sel = inst.getSelection()
    if (sel && sel.length >= 2) {
      const col = sel[0]
      const row = sel[1]
      const address = cellAddress(col, row)
      activeCellAddress.value = address
      const val = inst.getValue(col, row)
      activeCellValue.value = val != null ? String(val) : ''
      const meta = inst.getMeta(col, row)
      formulaValue.value = meta?.formula || ''
    }
  } catch {}
}

function updateSelectionSummary(col1, row1, col2, row2) {
  if (col1 === col2 && row1 === row2) {
    selectedRangeSummary.value = ''
    return
  }
  selectedRangeSummary.value = `${cellAddress(col1, row1)}:${cellAddress(col2, row2)}`
}

function cellAddress(col, row) {
  let c = ''
  let n = col
  while (n >= 0) { c = String.fromCharCode(65 + (n % 26)) + c; n = Math.floor(n / 26) - 1 }
  return c + (row + 1)
}

function handleCellChanges(instance, changes) {
  if (!changes) return
  for (const change of changes) {
    const col = change[1]
    const row = change[0]
    const val = change[2]
    if (typeof val === 'string' && val.startsWith('=')) {
      instance.setMeta(col, row, { formula: val })
    }
  }
}

function onFormulaUpdate(value) {
  formulaValue.value = value
}

function acceptFormula() {
  const inst = ss.getActiveInstance()
  if (!inst) return
  try {
    const sel = inst.getSelection()
    if (!sel || sel.length < 2) return
    const col = sel[0]
    const row = sel[1]
    if (formulaValue.value.startsWith('=')) {
      inst.setValue(col, row, formulaValue.value)
      inst.setMeta(col, row, { formula: formulaValue.value })
    } else {
      inst.setValue(col, row, formulaValue.value)
      inst.setMeta(col, row, { formula: '' })
    }
    updateFormulaBar()
  } catch {}
}

function refreshSelectedRange() {
  const range = ss.getSelectedRange()
  if (range) {
    chartDraft.value.range = range.range
    chartDraft.value.rangeSheet = range.sheet
    chartDraft.value.rangeData = range.values
    chartDraft.value.rangeCol1 = range.col1
    chartDraft.value.rangeRow1 = range.row1
    chartDraft.value.rangeCol2 = range.col2
    chartDraft.value.rangeRow2 = range.row2
  }
}

function openChartDialog() {
  chartDraft.value = {
    sourceType: 'range',
    range: '',
    xCol: '', yCol: '', chartType: 'bar', agg: 'SUM',
    rangeData: null, rangeSheet: '', rangeCol1: 0, rangeRow1: 0, rangeCol2: 0, rangeRow2: 0,
  }
  refreshSelectedRange()
  chartDialogOpen.value = true
}

function openTableDialog() {
  emit('add-table')
}

function createChart() {
  if (chartDraft.value.sourceType === 'range') {
    emit('chart-from-range', {
      sourceType: 'range',
      range: chartDraft.value.range,
      sheet: chartDraft.value.rangeSheet,
      chartType: chartDraft.value.chartType,
      rangeData: chartDraft.value.rangeData,
      rangeCol1: chartDraft.value.rangeCol1,
      rangeRow1: chartDraft.value.rangeRow1,
      rangeCol2: chartDraft.value.rangeCol2,
      rangeRow2: chartDraft.value.rangeRow2,
    })
  } else {
    emit('add-chart')
  }
  chartDialogOpen.value = false
}

function getInstance() {
  return jssInstance
}

function getDataForSheet(sheetIndex) {
  if (!jssInstance || !jssInstance[sheetIndex]) return []
  try {
    return jssInstance[sheetIndex].getData()
  } catch { return [] }
}

defineExpose({
  getInstance,
  getDataForSheet,
  refreshSelectedRange,
  initGrid,
})
</script>

<style scoped>
.spreadsheet-grid {
  min-height: 300px;
}
.spreadsheet-grid :deep(table) {
  font-size: 12px;
}
.spreadsheet-grid :deep(td) {
  padding: 2px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

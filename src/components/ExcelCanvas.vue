<template>
  <div class="excel-canvas flex flex-col h-full bg-white">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Spreadsheet</span>
        <span class="text-xs text-gray-400">{{ activeSheetName }} &middot; {{ dataRowCount }} rows</span>
      </div>
      <div class="flex items-center gap-2">
        <button @click="zoomOut" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">-</button>
        <span class="text-xs text-gray-500 w-8 text-center">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">+</button>
        <div class="w-px h-4 bg-gray-200 mx-1"></div>
        <button @click="onAddChart" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">+ Chart</button>
        <button @click="$emit('add-table')" class="bg-violet-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-violet-700">+ Table</button>
        <div class="w-px h-4 bg-gray-200 mx-1"></div>
        <button @click="$emit('auto-layout')" class="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 text-gray-600">Auto</button>
        <button @click="$emit('toggle-view')" class="text-xs px-3 py-1.5 rounded font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600">Design View</button>
      </div>
    </div>

    <!-- Formula bar -->
    <FormulaBar
      :active-cell-address="activeCellAddress"
      :formula-value="formulaValue"
      @update-formula="onFormulaUpdate"
      @accept-formula="onFormulaAccept"
    />

    <!-- Empty state (should rarely show — default sheet auto-created) -->
    <div v-if="!hasSheets" class="flex-1 flex items-center justify-center bg-gray-50 flex-col gap-4 p-8">
      <div class="text-gray-400 text-lg font-medium">No data loaded</div>
      <p class="text-gray-400 text-sm text-center max-w-md">Upload a CSV file in the <strong>Upload</strong> step to get started.</p>
    </div>

    <!-- Grid area -->
    <div v-else ref="scrollContainer" class="flex-1 overflow-auto relative bg-gray-50" @scroll="onScroll" tabindex="0" @keydown="onKeyDown">
      <!-- Spacer for scroll dimensions -->
      <div :style="spacerStyle" class="pointer-events-none" />

      <!-- Konva Stage (sticky) -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="w-full h-full pointer-events-auto">
          <Stage :config="stageConfig" @mousedown="onStageMouseDown" @mousemove="onStageMouseMove" @mouseup="onStageMouseUp">
            <Layer :config="{ clip: { x: 0, y: 0, width: stageW, height: stageH } }">
              <!-- Corner cell -->
              <Rect :config="cornerConfig" />
              <!-- Column headers -->
              <template v-for="col in renderedHeaders" :key="'h'+col">
                <Rect :config="headerBg(col)" @mousedown="e => startColResize(e, col)" />
                <Text :config="headerText(col)" />
              </template>
              <!-- Row numbers -->
              <template v-for="row in renderedRows" :key="'r'+row">
                <Rect :config="rowNumBg(row)" />
                <Text :config="rowNumText(row)" />
              </template>
              <!-- Data cells -->
              <template v-for="row in renderedRows" :key="'d'+row">
                <template v-for="col in renderedDataCols" :key="'c'+col">
                  <Rect :config="cellBg(row, col)" @dblclick="e => editCell(row, col)" />
                  <Text :config="cellText(row, col)" />
                </template>
              </template>
              <!-- Selection -->
              <Rect v-if="selRange" :config="selRange" />
              <Rect v-if="selCell" :config="selCell" />
              <!-- Column resize indicator -->
              <Rect v-if="resizeLine" :config="resizeLine" />
              <!-- Charts anchored to cells -->
              <Group v-for="a in renderedAnchors" :key="'a'+a.chartId" :config="{ x: a.screenX, y: a.screenY }">
                <Rect :config="a.bg" />
                <Text :config="a.label" />
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>

      <!-- Edit input overlay -->
      <input v-if="editing"
        ref="editInput"
        v-model="editValue"
        class="absolute z-20 px-1.5 py-0.5 rounded-none outline-none border-2 border-blue-500 text-sm font-sans"
        :style="editStyle"
        @blur="finishEdit"
        @keydown.enter="finishEdit"
        @keydown.escape="cancelEdit"
        @keydown.tab.prevent="finishEditAndMove(0, 1)"
        autofocus />
    </div>

    <!-- Sheet tabs -->
    <div class="flex items-center bg-gray-100 border-t border-gray-200 px-2 shrink-0 overflow-x-auto">
      <button v-for="(s, i) in sheetNames" :key="i"
        @click="switchSheet(i)"
        class="text-xs px-3 py-1.5 border-t-2 font-medium transition-colors whitespace-nowrap shrink-0"
        :class="i === gridModel.activeSheetIndex ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
        {{ s.name }}
      </button>
      <button @click="addBlankSheet"
        class="text-xs px-2.5 py-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors shrink-0 font-bold leading-none"
        title="Add blank sheet">+</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Stage, Layer, Rect, Group, Text, Image as VImage } from 'vue-konva'
import FormulaBar from './FormulaBar.vue'
import { gridModel, GridModel, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT, HEADER_ROW_HEIGHT } from '../lib/konvaGridModel'

const ROW_NUM_W = 50
const MIN_COL_W = 40

const props = defineProps({
  tables: { type: Array, default: () => [] },
  charts: { type: Array, default: () => [] },
  texts: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  availableTables: { type: Array, default: () => [] },
  viewOnly: { type: Boolean, default: false },
  joinedData: { type: Array, default: null },
  pivots: { type: Array, default: () => [] },
})

const emit = defineEmits(['add-chart', 'add-table', 'add-text', 'auto-layout', 'toggle-view'])

const scrollContainer = ref(null)
const editInput = ref(null)
const scale = ref(1)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const stageW = ref(800)
const stageH = ref(600)
const editing = ref(false)
const editValue = ref('')
const editPos = ref(null)
const activeCellAddress = ref('')
const formulaValue = ref('')
const resizing = ref(null)
const resizeLineX = ref(0)
const isSelecting = ref(false)
const selectStart = ref(null)

let _idc = 0
function uid() { return (Date.now() + ++_idc).toString(36) }

// ─── Reactive bridge for gridModel (plain JS not reactive) ─
const gridVer = ref(0)
function bumpGrid() { gridVer.value++ }

// Pre-initialize a default sheet before first render so the grid is never blank
if (gridModel.sheets.length === 0) {
  gridModel.sheets = []
  gridModel.addSheet('Sheet1', { colCount: 26, rowCount: 100 })
  gridModel.activeSheetIndex = 0
}
gridVer.value++

// ─── Grid Model ──────────────────────────────────────────
const sheetNames = computed(() => { gridVer.value; return gridModel.sheets })
const hasSheets = computed(() => { gridVer.value; return gridModel.sheets.length > 0 })
const activeSheet = computed(() => { gridVer.value; return gridModel.getActiveSheet() })
const activeSheetName = computed(() => activeSheet.value?.name || '')
const dataRowCount = computed(() => {
  const s = activeSheet.value
  return s ? Math.max(0, s.rowCount - 1) : 0
})

// ─── Scroll dimensions ───────────────────────────────────
const totalGridW = computed(() => {
  const s = activeSheet.value
  if (!s) return 800
  let w = ROW_NUM_W
  for (let c = 0; c < s.colCount; c++) w += s.getColWidth(c)
  return w
})
const totalGridH = computed(() => {
  const s = activeSheet.value
  if (!s) return 600
  let h = HEADER_ROW_HEIGHT
  for (let r = 1; r < s.rowCount; r++) h += s.getRowHeight(r)
  return h
})
const spacerStyle = computed(() => ({
  width: totalGridW.value + 'px',
  height: totalGridH.value + 'px',
}))
const stageConfig = computed(() => ({
  width: stageW.value,
  height: stageH.value,
  scaleX: scale.value,
  scaleY: scale.value,
}))

// ─── Visible range calculation ───────────────────────────
const dataStartRow = computed(() => {
  const s = activeSheet.value
  if (!s) return 1
  return Math.max(1, Math.floor(scrollTop.value / DEFAULT_ROW_HEIGHT))
})
const dataEndRow = computed(() => {
  const s = activeSheet.value
  if (!s) return 50
  const max = s.rowCount - 1
  const fromScroll = Math.ceil((scrollTop.value + stageH.value / scale.value) / DEFAULT_ROW_HEIGHT)
  return Math.min(max, fromScroll + 2)
})
const dataStartCol = computed(() => {
  const s = activeSheet.value
  if (!s) return 0
  const adj = Math.max(0, scrollLeft.value - ROW_NUM_W)
  return Math.max(0, Math.floor(adj / DEFAULT_COL_WIDTH))
})
const dataEndCol = computed(() => {
  const s = activeSheet.value
  if (!s) return 10
  const max = s.colCount - 1
  const adj = Math.max(0, scrollLeft.value - ROW_NUM_W)
  const fromScroll = Math.ceil((adj + stageW.value / scale.value) / DEFAULT_COL_WIDTH)
  return Math.min(max, fromScroll + 2)
})

const renderedHeaders = computed(() => {
  const s = activeSheet.value
  if (!s) return []
  const start = Math.max(0, Math.floor((scrollLeft.value - ROW_NUM_W) / DEFAULT_COL_WIDTH))
  const end = Math.min(s.colCount - 1, Math.ceil((scrollLeft.value - ROW_NUM_W + stageW.value / scale.value) / DEFAULT_COL_WIDTH) + 2)
  const cols = []
  for (let c = start; c <= end; c++) cols.push(c)
  return cols
})
const renderedRows = computed(() => {
  const s = activeSheet.value
  if (!s) return []
  const start = Math.max(1, Math.floor(scrollTop.value / DEFAULT_ROW_HEIGHT))
  const end = Math.min(s.rowCount - 1, Math.ceil((scrollTop.value + stageH.value / scale.value) / DEFAULT_ROW_HEIGHT) + 2)
  const rows = []
  for (let r = start; r <= end; r++) rows.push(r)
  return rows
})
const renderedDataCols = computed(() => {
  const s = activeSheet.value
  if (!s) return []
  const start = Math.max(0, Math.floor((scrollLeft.value - ROW_NUM_W) / DEFAULT_COL_WIDTH))
  const end = Math.min(s.colCount - 1, Math.ceil((scrollLeft.value - ROW_NUM_W + stageW.value / scale.value) / DEFAULT_COL_WIDTH) + 2)
  const cols = []
  for (let c = start; c <= end; c++) cols.push(c)
  return cols
})

// ─── Position helpers ────────────────────────────────────
function dataX(col) {
  const s = activeSheet.value
  if (!s) return ROW_NUM_W + col * DEFAULT_COL_WIDTH - scrollLeft.value
  let x = ROW_NUM_W - scrollLeft.value
  for (let c = 0; c < col; c++) x += s.getColWidth(c)
  return x
}

function dataY(row) {
  return HEADER_ROW_HEIGHT + ((row - 1) * (activeSheet.value?.getRowHeight(row) || DEFAULT_ROW_HEIGHT)) - scrollTop.value
}

function headerCellWidth(col) {
  return activeSheet.value?.getColWidth(col) || DEFAULT_COL_WIDTH
}

function dataCellHeight(row) {
  return activeSheet.value?.getRowHeight(row) || DEFAULT_ROW_HEIGHT
}

// ─── Corner ──────────────────────────────────────────────
const cornerConfig = computed(() => ({
  x: 0, y: 0, width: ROW_NUM_W, height: HEADER_ROW_HEIGHT,
  fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 1,
}))

// ─── Header rendering ────────────────────────────────────
function headerBg(col) {
  const x = dataX(col)
  return {
    x, y: 0, width: headerCellWidth(col), height: HEADER_ROW_HEIGHT,
    fill: '#f3f4f6', stroke: '#d1d5db', strokeWidth: 0.5,
  }
}

function headerText(col) {
  const s = activeSheet.value
  const val = s ? s.getCellValue(0, col) : ''
  const label = val || GridModel.colLetter(col)
  const x = dataX(col)
  return {
    x: x + 4, y: 0, width: headerCellWidth(col) - 8, height: HEADER_ROW_HEIGHT,
    text: String(label), fontSize: 11, fill: '#374151', fontStyle: 'bold',
    verticalAlign: 'middle', ellipsis: true,
  }
}

// ─── Row number rendering ────────────────────────────────
function rowNumBg(row) {
  const y = dataY(row)
  return {
    x: 0, y, width: ROW_NUM_W, height: dataCellHeight(row),
    fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 0.5,
  }
}

function rowNumText(row) {
  const y = dataY(row)
  return {
    x: 0, y, width: ROW_NUM_W - 4, height: dataCellHeight(row),
    text: String(row), fontSize: 10, fill: '#6b7280',
    verticalAlign: 'middle', align: 'right', ellipsis: true,
  }
}

// ─── Cell rendering ─────────────────────────────────────
function cellBg(row, col) {
  const s = activeSheet.value
  const x = dataX(col)
  const y = dataY(row)
  const isSel = gridModel.activeCell && gridModel.activeCell.row === row && gridModel.activeCell.col === col
  const w = s?.getColWidth(col) || DEFAULT_COL_WIDTH
  const h = dataCellHeight(row)
  return {
    x, y, width: w, height: h,
    fill: isSel ? '#dbeafe' : ((row + col) % 2 === 0 ? '#ffffff' : '#f9fafb'),
    stroke: '#e5e7eb', strokeWidth: 0.5,
  }
}

function cellText(row, col) {
  const s = activeSheet.value
  const val = s ? s.getCellValue(row, col) : ''
  const x = dataX(col)
  const y = dataY(row)
  const isNum = /^[\d,.kMB%$€£¥\-\d]+$/.test(String(val).trim())
  return {
    x: x + 4, y, width: (s?.getColWidth(col) || DEFAULT_COL_WIDTH) - 8, height: dataCellHeight(row),
    text: val != null ? String(val) : '', fontSize: 11, fill: '#374151',
    verticalAlign: 'middle', align: isNum ? 'right' : 'left', ellipsis: true,
  }
}

// ─── Selection overlay ──────────────────────────────────
const selCell = computed(() => {
  const ac = gridModel.activeCell
  if (!ac) return null
  const s = activeSheet.value
  if (!s) return null
  return {
    x: dataX(ac.col), y: dataY(ac.row),
    width: s.getColWidth(ac.col), height: dataCellHeight(ac.row),
    stroke: '#3b82f6', strokeWidth: 2,
  }
})

const selRange = computed(() => {
  const r = gridModel.selectionRange
  const ac = gridModel.activeCell
  if (!r || !ac) return null
  if (r.row1 === r.row2 && r.col1 === r.col2) return null
  const s = activeSheet.value
  if (!s) return null
  const xMin = dataX(Math.min(r.col1, r.col2))
  const xMax = dataX(Math.max(r.col1, r.col2)) + s.getColWidth(Math.max(r.col1, r.col2))
  const yMin = dataY(Math.min(r.row1, r.row2))
  const yMax = dataY(Math.max(r.row1, r.row2)) + dataCellHeight(Math.max(r.row1, r.row2))
  return {
    x: xMin, y: yMin,
    width: xMax - xMin, height: yMax - yMin,
    fill: 'rgba(59, 130, 246, 0.08)',
    stroke: '#3b82f6', strokeWidth: 1,
  }
})

// ─── Charts anchored to cells ───────────────────────────
const renderedAnchors = computed(() => {
  const anchors = gridModel.chartAnchors.filter(a => a.sheetIndex === gridModel.activeSheetIndex)
  const s = activeSheet.value
  if (!s) return []
  return anchors.map(a => {
    const sx = dataX(a.anchorCell.col)
    const sy = dataY(a.anchorCell.row)
    const w = a.width || 360
    const h = a.height || 240
    return {
      chartId: a.chartId,
      screenX: sx,
      screenY: sy,
      bg: { x: 0, y: 0, width: w, height: h, fill: '#f0f9ff', stroke: '#93c5fd', strokeWidth: 1, cornerRadius: 4 },
      label: {
        x: 8, y: 8, width: w - 16, height: h - 16,
        text: a.title || 'Chart',
        fontSize: 12, fill: '#1e40af',
        verticalAlign: 'middle', align: 'center',
      },
    }
  })
})

// ─── Events ─────────────────────────────────────────────
function onScroll() {
  const el = scrollContainer.value
  if (!el) return
  scrollTop.value = el.scrollTop
  scrollLeft.value = el.scrollLeft
}

function onStageMouseDown(e) {
  scrollContainer.value?.focus()
  if (props.viewOnly || !activeSheet.value) return
  const stage = e.target.getStage()
  if (!stage) return
  const ptr = stage.getPointerPosition()
  if (!ptr) return
  const mx = ptr.x - ROW_NUM_W + scrollLeft.value
  const my = ptr.y - HEADER_ROW_HEIGHT + scrollTop.value
  if (mx < 0 || my < 0) return
  const col = Math.floor(mx / DEFAULT_COL_WIDTH)
  const row = Math.floor(my / DEFAULT_ROW_HEIGHT) + 1
  if (row < 1 || col < 0 || row >= activeSheet.value.rowCount || col >= activeSheet.value.colCount) return

  if (e.evt && e.evt.shiftKey && gridModel.activeCell) {
    gridModel.setSelectionRange(
      gridModel.activeCell.row, gridModel.activeCell.col,
      row, col
    )
  } else {
    gridModel.setActiveCell(row, col)
    isSelecting.value = true
    selectStart.value = { row, col }
  }
  bumpGrid()
  updateFormulaBar()
}

function onStageMouseMove(e) {
  if (resizing.value) return
  if (!isSelecting.value || !selectStart.value || !activeSheet.value) return
  const stage = e.target.getStage()
  if (!stage) return
  const ptr = stage.getPointerPosition()
  if (!ptr) return
  const mx = ptr.x - ROW_NUM_W + scrollLeft.value
  const my = ptr.y - HEADER_ROW_HEIGHT + scrollTop.value
  if (mx < 0 || my < 0) return
  const col = Math.min(Math.max(0, Math.floor(mx / DEFAULT_COL_WIDTH)), activeSheet.value.colCount - 1)
  const row = Math.min(Math.max(1, Math.floor(my / DEFAULT_ROW_HEIGHT) + 1), activeSheet.value.rowCount - 1)

  gridModel.setSelectionRange(
    selectStart.value.row, selectStart.value.col,
    row, col
  )
  bumpGrid()
}

function onStageMouseUp() {
  isSelecting.value = false
  selectStart.value = null
}

function startColResize(e, col) {
  if (props.viewOnly) return
  e.cancelBubble = true
  const stage = e.target.getStage()
  if (!stage) return
  const ptr = stage.getPointerPosition()
  if (!ptr) return
  const s = activeSheet.value
  if (!s) return
  const colRightScreen = (dataX(col) + s.getColWidth(col)) * scale.value
  if (Math.abs(ptr.x - colRightScreen) > 6) return
  resizing.value = { col, startX: ptr.x, startW: s.getColWidth(col) }
  const onMove = () => {
    const p = stage.getPointerPosition()
    if (!p) return
    const dx = p.x - resizing.value.startX
    resizing.value.newWidth = Math.max(MIN_COL_W, resizing.value.startW + dx)
    resizeLineX.value = dataX(col) + resizing.value.newWidth
  }
  const onUp = () => {
    if (resizing.value) {
      s.setColWidth(col, Math.max(MIN_COL_W, resizing.value.newWidth || s.getColWidth(col)))
    }
    resizing.value = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const resizeLine = computed(() => {
  if (!resizing.value) return null
  return { x: resizeLineX.value, y: 0, width: 2, height: stageH.value, fill: '#3b82f6' }
})

// ─── Cell editing ───────────────────────────────────────
function editCell(row, col) {
  if (props.viewOnly) return
  const s = activeSheet.value
  if (!s) return
  gridModel.setActiveCell(row, col)
  bumpGrid()
  editing.value = true
  editValue.value = s.getCellRaw(row, col)
  updateFormulaBar()
  nextTick(() => {
    positionEditOverlay(row, col)
    editInput.value?.focus()
  })
}

function positionEditOverlay(row, col) {
  const container = scrollContainer.value
  if (!container) return
  const s = activeSheet.value
  if (!s) return
  const x = dataX(col)
  const y = dataY(row)
  const w = s.getColWidth(col)
  const h = dataCellHeight(row)
  editPos.value = { row, col }
  editStyle.value = {
    left: Math.max(0, x * scale.value) + 'px',
    top: Math.max(0, y * scale.value) + 'px',
    width: (w * scale.value - 2) + 'px',
    height: (h * scale.value - 2) + 'px',
    fontSize: Math.round(11 * scale.value) + 'px',
  }
}

const editStyle = ref({})

function finishEdit() {
  if (!editing.value || !editPos.value) return
  const { row, col } = editPos.value
  const val = editValue.value
  if (typeof val === 'string' && val.startsWith('=')) {
    gridModel.setCellValue(row, col, val)
    activeSheet.value?.recalcAll()
  } else {
    gridModel.setCellValue(row, col, val)
  }
  bumpGrid()
  editing.value = false
  editPos.value = null
}

function cancelEdit() {
  editing.value = false
  editPos.value = null
}

function finishEditAndMove(dRow, dCol) {
  finishEdit()
  gridModel.moveActiveCell(dRow, dCol)
  bumpGrid()
  updateFormulaBar()
}

// ─── Formula bar ────────────────────────────────────────
function updateFormulaBar() {
  const ac = gridModel.activeCell
  if (!ac) {
    activeCellAddress.value = ''
    formulaValue.value = ''
    return
  }
  activeCellAddress.value = GridModel.cellAddress(ac.row, ac.col)
  formulaValue.value = activeSheet.value?.getCellRaw(ac.row, ac.col) || ''
}

function onFormulaUpdate(val) {
  formulaValue.value = val
}

function onFormulaAccept() {
  const ac = gridModel.activeCell
  if (!ac || !activeSheet.value) return
  const val = formulaValue.value
  if (typeof val === 'string' && val.startsWith('=')) {
    gridModel.setCellValue(ac.row, ac.col, val)
    activeSheet.value.recalcAll()
  } else {
    gridModel.setCellValue(ac.row, ac.col, val)
  }
  bumpGrid()
}

// ─── Keyboard ───────────────────────────────────────────
function onKeyDown(e) {
  if (editing.value) return
  if (props.viewOnly) return
  const ac = gridModel.activeCell
  if (!ac) return

  if (e.key === 'ArrowUp') { e.preventDefault(); gridModel.moveActiveCell(-1, 0); bumpGrid(); updateFormulaBar() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); gridModel.moveActiveCell(1, 0); bumpGrid(); updateFormulaBar() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); gridModel.moveActiveCell(0, -1); bumpGrid(); updateFormulaBar() }
  else if (e.key === 'ArrowRight') { e.preventDefault(); gridModel.moveActiveCell(0, 1); bumpGrid(); updateFormulaBar() }
  else if (e.key === 'Tab') { e.preventDefault(); gridModel.moveActiveCell(0, 1); bumpGrid(); updateFormulaBar() }
  else if (e.key === 'Enter') { e.preventDefault(); editCell(ac.row, ac.col) }
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    const sheet = activeSheet.value
    if (sheet) {
      sheet.clearCell(ac.row, ac.col)
      bumpGrid()
      updateFormulaBar()
    }
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    editCell(ac.row, ac.col)
    editValue.value = e.key
  }
}

// ─── Zoom ───────────────────────────────────────────────
function zoomIn() { scale.value = Math.min(2, scale.value * 1.2) }
function zoomOut() { scale.value = Math.max(0.3, scale.value / 1.2) }

// ─── Sheet switching ────────────────────────────────────
function switchSheet(index) {
  gridModel.setActiveSheet(index)
  bumpGrid()
  updateFormulaBar()
}

function addBlankSheet() {
  const n = gridModel.sheets.length + 1
  gridModel.addSheet(`Sheet${n}`, { colCount: 26, rowCount: 100 })
  gridModel.setActiveSheet(gridModel.sheets.length - 1)
  bumpGrid()
  updateFormulaBar()
}

// ─── Chart creation ─────────────────────────────────────
function onAddChart() {
  const ac = gridModel.activeCell
  const row = ac?.row ?? 1
  const col = ac?.col ?? 0
  const chartId = uid()
  gridModel.addChartAnchor(chartId, row, col, {
    title: 'Chart ' + (gridModel.chartAnchors.length + 1),
    width: 360,
    height: 240,
  })
  bumpGrid()
  emit('add-chart', { id: chartId, anchorRow: row, anchorCol: col })
}

// Sync props.charts → chartAnchors (keep in sync when parent creates/removes charts)
watch(() => props.charts, (newCharts) => {
  const activeIds = new Set(newCharts.map(c => c.id))
  gridModel.chartAnchors = gridModel.chartAnchors.filter(a => activeIds.has(a.chartId))
  for (const ch of newCharts) {
    if (ch.anchorCell && !gridModel.chartAnchors.find(a => a.chartId === ch.id)) {
      gridModel.addChartAnchor(ch.id, ch.anchorCell.row, ch.anchorCell.col, {
        title: ch.title,
        width: ch.width || 360,
        height: ch.height || 240,
      })
    }
  }
  bumpGrid()
}, { immediate: true, deep: true })

// ─── Reposition edit overlay on scroll ──────────────────
watch([scrollTop, scrollLeft], () => {
  if (editing.value && editPos.value) {
    positionEditOverlay(editPos.value.row, editPos.value.col)
  }
})

// ─── Init ───────────────────────────────────────────────
function initModel() {
  gridModel.sheets = []
  if (props.tables.length) {
    const joinedData = props.joinedData
    const pivots = props.pivots
    gridModel.initFromTables(props.tables, joinedData, pivots)
  }
  // Always keep at least one blank scratch sheet
  if (gridModel.sheets.length === 0) {
    gridModel.addSheet('Sheet1', { colCount: 26, rowCount: 100 })
    gridModel.activeSheetIndex = 0
  }
  bumpGrid()
  nextTick(() => {
    updateFormulaBar()
    updateSize()
  })
}

watch([() => props.tables, () => props.joinedData, () => props.pivots], initModel, { deep: true })

function updateSize() {
  const el = scrollContainer.value
  if (el) {
    stageW.value = el.clientWidth
    stageH.value = el.clientHeight
  }
}

let resizeObserver = null
onMounted(() => {
  initModel()
  updateSize()
  if (scrollContainer.value) {
    resizeObserver = new ResizeObserver(() => updateSize())
    resizeObserver.observe(scrollContainer.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

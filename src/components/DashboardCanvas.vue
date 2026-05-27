<template>
  <div class="flex gap-4 h-full" style="min-height:500px">
      <div :class="viewOnly ? 'w-full' : 'flex-1 flex flex-col min-h-0'">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0" :class="viewOnly ? 'border-0 rounded-none' : ''">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Canvas</span>
            <span class="text-xs text-gray-400">{{ charts.length + texts.length }} items</span>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="!viewOnly">
              <button @click="zoomOut" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">-</button>
              <span class="text-xs text-gray-500 w-8 text-center">{{ Math.round(zoom * 100) }}%</span>
              <button @click="zoomIn" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">+</button>
              <div class="w-px h-4 bg-gray-200 mx-1"></div>
              <button @click="$emit('add-chart')" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">+ Chart</button>
              <button @click="addText" class="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-700">+ Text</button>
              <div class="w-px h-4 bg-gray-200 mx-1"></div>
              <button @click="$emit('auto-layout')" class="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-100 text-gray-600">Auto</button>
            </template>
            <button @click="$emit('toggle-view')" class="text-xs px-3 py-1.5 rounded font-medium transition-colors"
              :class="viewOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-300 hover:bg-gray-100 text-gray-600'">
              {{ viewOnly ? 'Edit' : 'View' }}
            </button>
          </div>
        </div>
        <div class="overflow-auto relative select-none canvas-scroll flex-1 min-h-0"
          :class="viewOnly ? 'h-[90vh]' : ''"
          @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp" @click.self="selectedId = null">
          <div class="relative" :style="canvasStyle">
            <svg class="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <defs>
                <pattern id="cg" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5" />
                </pattern>
                <pattern id="cgl" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#cg)" />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#e0e0e0" stroke-width="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cgl)" />
            </svg>
            <div v-for="t in texts" :key="t.id"
              class="absolute px-2 py-1 rounded"
              :class="[viewOnly ? '' : 'cursor-move hover:ring-1 hover:ring-blue-300', !viewOnly && selectedId === t.id ? 'ring-2 ring-blue-500 bg-blue-50/50 z-10' : 'z-0']"
              :style="{ left:(t.x||0)+'px', top:(t.y||0)+'px', fontSize:(t.fontSize||14)+'px', fontWeight:t.bold?'bold':'normal', color:t.color||'#333' }"
              @mousedown.stop="viewOnly ? null : startDragItem($event, t, 'text')"
              @dblclick.stop="viewOnly ? null : (editingTextId = t.id)"
              @click.stop="viewOnly ? null : (selectedId = t.id)">
              <span v-if="editingTextId !== t.id">{{ t.text || 'Double-click to edit' }}</span>
              <input v-else :value="t.text" @input="updateText(t.id, $event.target.value)"
                @blur="editingTextId = null" @keydown.enter="editingTextId = null"
                class="border-none outline-none bg-transparent p-0 m-0 min-w-[50px]"
                :style="{ fontSize:(t.fontSize||14)+'px', fontWeight:t.bold?'bold':'normal', color:t.color||'#333' }" autofocus />
            </div>
            <div v-for="chart in charts" :key="chart.id"
              class="absolute bg-white border-2 rounded-lg shadow-sm overflow-hidden"
              :class="viewOnly ? 'border-transparent shadow-none' : (selectedId === chart.id ? 'border-blue-500 shadow-md z-10' : 'border-gray-200 hover:border-gray-300 z-0')"
              :style="{ left:(chart.x||20)+'px', top:(chart.y||20)+'px', width:(chart.width||400)+'px', height:(chart.height||300)+'px' }"
              @mousedown.stop="viewOnly ? null : startDragItem($event, chart, 'chart')"
              @click.stop="viewOnly ? null : (selectedId = chart.id)">
              <div v-if="!viewOnly" class="flex items-center px-3 py-1.5 cursor-move select-none text-xs border-b" :class="selectedId === chart.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50/50 border-gray-100'">
                <span class="font-medium text-gray-600 truncate flex-1">{{ chart.title || 'Chart' }}</span>
                <span class="text-gray-400 capitalize ml-2">{{ chart.chartType }}</span>
                <button @mousedown.stop @click.stop="$emit('remove-chart', chart.id)" class="text-gray-300 hover:text-red-400 text-base leading-none ml-2">&times;</button>
              </div>
              <div class="p-2" :style="{ height: (chart.height - 34) + 'px' }">
                <div v-if="chart._loading" class="flex items-center justify-center h-full text-gray-400 text-xs">
                  <svg class="animate-spin h-4 w-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg> Loading...
                </div>
                <div v-else-if="chart._error" class="flex items-center justify-center h-full text-red-400 text-xs">{{ chart._error }}</div>
                <div v-else-if="!chart.chartData" class="flex items-center justify-center h-full text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded">Select columns</div>
                <div v-else class="h-full w-full">
                  <Bar v-if="chart.chartType==='bar'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                  <Line v-if="chart.chartType==='line'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                  <Pie v-if="chart.chartType==='pie'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                  <Doughnut v-if="chart.chartType==='doughnut'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                  <PolarArea v-if="chart.chartType==='polarArea'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                  <Radar v-if="chart.chartType==='radar'" :ref="r => chartRefs[chart.id] = r" :data="chart.chartData" :options="chartOptions" />
                </div>
              </div>
              <template v-if="!viewOnly && selectedId === chart.id">
                <div class="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-nw-resize" style="top:-6px;left:-6px" @mousedown.stop="startResize($event, chart)"></div>
                <div class="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-ne-resize" style="top:-6px;right:-6px" @mousedown.stop="startResize($event, chart)"></div>
                <div class="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-sw-resize" style="bottom:-6px;left:-6px" @mousedown.stop="startResize($event, chart)"></div>
                <div class="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm cursor-se-resize" style="bottom:-6px;right:-6px" @mousedown.stop="startResize($event, chart)"></div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!viewOnly" class="w-72 shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
      <div class="flex border-b border-gray-100 bg-gray-50/50 shrink-0">
        <button @click="sidebarTab = 'properties'"
          class="flex-1 px-3 py-2.5 text-xs font-medium transition-colors text-center"
          :class="sidebarTab === 'properties' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'">
          Properties
        </button>
        <button @click="sidebarTab = 'chat'"
          class="flex-1 px-3 py-2.5 text-xs font-medium transition-colors text-center"
          :class="sidebarTab === 'chat' ? 'text-purple-600 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:text-gray-700'">
          Chat
        </button>
      </div>

      <div v-if="sidebarTab === 'properties'" class="flex-1 overflow-y-auto">
        <div v-if="!selectedItem" class="p-4 text-center text-gray-400 text-sm mt-8">
          Select a chart or text annotation to edit its properties
        </div>
        <div v-if="selectedItem?._type === 'chart'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Title</label><input :value="selectedItem.title" @input="emitUpdate('title', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">X axis</label><select :value="selectedItem.xCol" @change="emitUpdate('xCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="" disabled>Select column</option><option v-for="c in columns" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Y axis</label><select :value="selectedItem.yCol" @change="emitUpdate('yCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="" disabled>Select column</option><option v-for="c in numericColumns" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Calculation</label><select :value="selectedItem.agg" @change="emitUpdate('agg', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option v-for="a in ['SUM','AVG','COUNT','MIN','MAX']" :key="a" :value="a">{{ a }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Chart type</label><select :value="selectedItem.chartType" @change="emitUpdate('chartType', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"><option v-for="t in chartTypes" :key="t" :value="t" class="capitalize">{{ t }}</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Sort</label><select :value="selectedItem.sortDir" @change="emitUpdate('sortDir', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="DESC">Highest first</option><option value="ASC">Lowest first</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Rows</label><input :value="selectedItem.limit" @input="emitUpdate('limit', Number($event.target.value)||50)" type="number" min="1" max="500" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Filter</label><input :value="selectedItem.filter" @input="emitUpdate('filter', $event.target.value)" type="text" placeholder='e.g. &quot;Region&quot; = &apos;West&apos;' class="w-full border rounded-md p-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Position &amp; Size</label><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-gray-400 block">X</label><input :value="selectedItem.x" @change="emitUpdate('x', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">Y</label><input :value="selectedItem.y" @change="emitUpdate('y', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">W</label><input :value="selectedItem.width" @change="emitUpdate('width', Math.max(200,Number($event.target.value)||400))" type="number" min="200" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">H</label><input :value="selectedItem.height" @change="emitUpdate('height', Math.max(150,Number($event.target.value)||300))" type="number" min="150" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div></div></div>
          <div class="pt-2 border-t"><button @click="downloadImage(selectedItem)" class="w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded py-1.5 font-medium">Download PNG</button></div>
        </div>
        <div v-if="selectedItem?._type === 'text'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Content</label><textarea :value="selectedItem.text" @input="emitTextUpdate('text', $event.target.value)" rows="3" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Font size</label><select :value="selectedItem.fontSize" @change="emitTextUpdate('fontSize', Number($event.target.value))" class="w-full border rounded-md p-1.5 text-sm bg-white"><option v-for="s in [10,12,14,16,18,20,24,28,32,36,48]" :key="s" :value="s">{{ s }}px</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Bold</label><button @click="emitTextUpdate('bold', !selectedItem.bold)" class="w-full border rounded-md p-1.5 text-sm font-bold" :class="selectedItem.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'">B</button></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Color</label><div class="flex gap-1 flex-wrap"><button v-for="c in ['#333','#666','#999','#c00','#080','#06c','#60c','#c60']" :key="c" @click="emitTextUpdate('color', c)" class="w-6 h-6 rounded border border-gray-200" :class="selectedItem.color===c?'ring-2 ring-blue-500':''" :style="{backgroundColor:c}"></button></div></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Position</label><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-gray-400 block">X</label><input :value="selectedItem.x" @change="emitTextUpdate('x', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">Y</label><input :value="selectedItem.y" @change="emitTextUpdate('y', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div></div></div>
          <div class="pt-2 border-t"><button @click="deleteText(selectedItem.id)" class="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded py-1.5 font-medium">Delete text</button></div>
        </div>
      </div>

      <div v-if="sidebarTab === 'chat'" class="flex-1 overflow-y-auto">
        <ChatPanel
          :schema-text="schemaText"
          :run-sql="runSql"
          :embedded="true"
          @apply-chart="(c) => $emit('apply-chart', c)"
          @run-sql="(sql) => $emit('run-sql', sql)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'vue-chartjs'
import ChatPanel from './ChatPanel.vue'

const props = defineProps({
  charts: { type: Array, default: () => [] },
  texts: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  viewOnly: { type: Boolean, default: false },
  schemaText: { type: String, default: '' },
  runSql: { type: Function, default: null },
})

const emit = defineEmits(['update', 'add-chart', 'remove-chart', 'update-text', 'add-text', 'delete-text', 'toggle-view', 'auto-layout', 'apply-chart', 'run-sql'])

const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'polarArea', 'radar']
const CANVAS_H = 1500
const selectedId = ref(null)
const zoom = ref(1)
const canvasWidth = ref(800) // will be set on mount
const chartRefs = {}
const editingTextId = ref(null)
const sidebarTab = ref('properties')
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }

const selectedItem = computed(() => {
  const c = props.charts.find(x => x.id === selectedId.value)
  if (c) return c
  const t = props.texts.find(x => x.id === selectedId.value)
  if (t) return t
  return null
})

const canvasStyle = computed(() => ({
  width: canvasWidth.value + 'px',
  height: CANVAS_H * zoom.value + 'px',
  transform: 'scale(' + zoom.value + ')',
  transformOrigin: 'top left',
}))

onMounted(() => {
  nextTick(() => {
    const parent = document.querySelector('.canvas-scroll')
    if (parent) canvasWidth.value = parent.clientWidth - 40
  })
})

function emitUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'chart') emit('update', { id: item.id, key, value })
}

function emitTextUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'text') emit('update-text', { id: item.id, key, value })
}

function addText() { emit('add-text') }
function deleteText(id) { emit('delete-text', id); if (selectedId.value === id) selectedId.value = null }
function updateText(id, text) { emit('update-text', { id, key: 'text', value: text }) }

let dragState = null

function startDragItem(e, item, type) {
  selectedId.value = item.id
  dragState = { item, type, startX: e.clientX, startY: e.clientY, origX: item.x || 0, origY: item.y || 0 }
}

function onMouseMove(e) {
  if (!dragState) return
  const dx = (e.clientX - dragState.startX) / zoom.value
  const dy = (e.clientY - dragState.startY) / zoom.value
  const newX = Math.max(0, Math.round((dragState.origX + dx) / 10) * 10)
  const newY = Math.max(0, Math.round((dragState.origY + dy) / 10) * 10)
  const evt = dragState.type === 'chart' ? 'update' : 'update-text'
  emit(evt, { id: dragState.item.id, key: 'x', value: newX })
  emit(evt, { id: dragState.item.id, key: 'y', value: newY })
}

function onMouseUp() { if (dragState?.resizing) document.body.style.cursor = ''; dragState = null }

function startResize(e, chart) {
  dragState = { chart, startX: e.clientX, startY: e.clientY, origW: chart.width || 400, origH: chart.height || 300, resizing: true }
  document.body.style.cursor = 'se-resize'; e.preventDefault()
}

async function downloadImage(chart) {
  const ref = chartRefs[chart.id]; if (!ref?.chart) return
  const url = ref.chart.toBase64Image('image/png', 1)
  const a = document.createElement('a'); a.href = url; a.download = (chart.title || 'chart').replace(/[^a-z0-9]/gi, '_') + '.png'; a.click()
}

async function captureAllImages() {
  const images = []
  for (const chart of props.charts) {
    const ref = chartRefs[chart.id]; if (!ref?.chart) continue
    try { images.push({ id: chart.id, dataUrl: ref.chart.toBase64Image('image/png', 0.8), title: chart.title, chartType: chart.chartType, agg: chart.agg, yCol: chart.yCol, xCol: chart.xCol, queryResult: chart.queryResult, _fromPivot: chart._fromPivot, _pivotRef: chart._pivotRef, _pivotHeaders: chart._pivotHeaders }) } catch {}
  }
  return images
}

function zoomIn() { zoom.value = Math.min(2, zoom.value + 0.1) }
function zoomOut() { zoom.value = Math.max(0.3, zoom.value - 0.1) }

defineExpose({ captureAllImages })
</script>
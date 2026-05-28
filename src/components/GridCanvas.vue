<template>
  <div class="flex gap-4 h-full" style="min-height:500px">
    <div class="flex-1 flex flex-col min-h-0">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Canvas</span>
            <span class="text-xs text-gray-400">{{ layout.length }} items</span>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="!viewOnly">
              <button @click="addChartItem" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">+ Chart</button>
              <button @click="addTableItem" class="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-emerald-700">+ Table</button>
              <button @click="addTextItemClick" class="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-gray-700">+ Text</button>
            </template>
            <button @click="$emit('toggle-view')" class="text-xs px-3 py-1.5 rounded font-medium transition-colors"
              :class="viewOnly ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-300 hover:bg-gray-100 text-gray-600'">
              {{ viewOnly ? 'Edit' : 'View' }}
            </button>
          </div>
        </div>
        <div class="overflow-auto flex-1 min-h-0 p-4"
          tabindex="0"
          @keydown="handleKeydown"
          @click.self="selectedId = null">
          <GridLayout
            v-model:layout="layout"
            :col-num="12"
            :row-height="40"
            :is-draggable="!viewOnly"
            :is-resizable="!viewOnly"
            :vertical-compact="true"
            :margin="[12, 12]"
            :use-css-transforms="true"
            @layout-updated="onLayoutUpdated">
            <GridItem v-for="item in layout" :key="item.i"
              :x="item.x" :y="item.y" :w="item.w" :h="item.h"
              :i="item.i" :min-w="item.minW" :min-h="item.minH"
              class="bg-white rounded-lg overflow-hidden"
              :class="selectedId === item.i ? 'ring-2 ring-blue-500 shadow-md z-10' : 'ring-1 ring-gray-200 hover:ring-gray-300'">
              <div class="h-full overflow-hidden relative" @click.stop="selectedId = item.i">
                <template v-if="getItem(item.i)?._type === 'chart'">
                  <div class="flex items-center px-3 py-1.5 text-xs border-b cursor-move select-none" :class="selectedId === item.i ? 'bg-blue-50 border-blue-200' : 'bg-gray-50/50 border-gray-100'">
                    <span class="font-medium text-gray-600 truncate flex-1">{{ getItem(item.i).title || 'Chart' }}</span>
                    <span class="text-gray-400 capitalize ml-2">{{ getItem(item.i).chartType }}</span>
                    <button v-if="selectedId === item.i && !viewOnly" @click.stop="removeChartItem(item.i)" class="text-gray-300 hover:text-red-400 text-base leading-none ml-2">&times;</button>
                  </div>
                  <div class="p-2" :style="{ height: 'calc(100% - 34px)' }">
                    <div v-if="getItem(item.i)._loading" class="flex items-center justify-center h-full text-gray-400 text-xs">
                      <svg class="animate-spin h-4 w-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg> Loading...
                    </div>
                    <div v-else-if="getItem(item.i)._error" class="flex items-center justify-center h-full text-red-400 text-xs">{{ getItem(item.i)._error }}</div>
                    <div v-else-if="!getItem(item.i).chartData" class="flex items-center justify-center h-full text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded">Select columns</div>
                    <div v-else class="h-full w-full">
                      <Bar v-if="getItem(item.i).chartType==='bar'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                      <Line v-if="getItem(item.i).chartType==='line'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                      <Pie v-if="getItem(item.i).chartType==='pie'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                      <Doughnut v-if="getItem(item.i).chartType==='doughnut'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                      <PolarArea v-if="getItem(item.i).chartType==='polarArea'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                      <Radar v-if="getItem(item.i).chartType==='radar'" :ref="r => chartRefs[item.i] = r" :data="getItem(item.i).chartData" :options="chartOptions" />
                    </div>
                  </div>
                </template>
                <template v-else-if="getItem(item.i)?._type === 'table'">
                  <div class="flex items-center px-3 py-1.5 text-xs border-b cursor-move select-none" :class="selectedId === item.i ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50/50 border-gray-100'">
                    <span class="font-medium text-gray-600 truncate flex-1">{{ getItem(item.i).title || 'Table' }}</span>
                    <span class="text-gray-400 ml-2">{{ getItem(item.i).columns?.length }} cols</span>
                    <button v-if="selectedId === item.i && !viewOnly" @click.stop="removeTableItem(item.i)" class="text-gray-300 hover:text-red-400 text-base leading-none ml-2">&times;</button>
                  </div>
                  <div class="overflow-auto" :style="{ height: 'calc(100% - 34px)' }">
                    <div v-if="getItem(item.i)._loading" class="flex items-center justify-center h-full text-gray-400 text-xs">Loading...</div>
                    <div v-else-if="getItem(item.i)._error" class="flex items-center justify-center h-full text-red-400 text-xs p-4">{{ getItem(item.i)._error }}</div>
                    <div v-else-if="!getItem(item.i).queryResult?.length" class="flex items-center justify-center h-full text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded mx-4">No data</div>
                    <table v-else class="w-full text-xs border-collapse">
                      <thead class="sticky top-0 z-10 bg-gray-50">
                        <tr>
                          <th v-for="col in getItem(item.i).columns" :key="col" class="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase border-b whitespace-nowrap">{{ col }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, ri) in getItem(item.i).queryResult" :key="ri" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
                          <td v-for="col in getItem(item.i).columns" :key="col" class="px-2 py-1 text-gray-600 whitespace-nowrap">{{ row[col] != null ? row[col] : '\u2014' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>
                <template v-else-if="getItem(item.i)?._type === 'text'">
                  <div class="flex items-center justify-between px-3 py-1.5 text-xs border-b bg-gray-50/50 cursor-move select-none">
                    <span class="text-gray-400">Text</span>
                    <button v-if="selectedId === item.i && !viewOnly" @click.stop="removeTextLayoutItem(item.i)" class="text-gray-300 hover:text-red-400 text-base leading-none">&times;</button>
                  </div>
                  <div class="p-3 h-full flex items-center" :style="{ height: 'calc(100% - 34px)' }" @dblclick.stop="!viewOnly ? (editingTextId = item.i) : null">
                    <template v-if="getItem(item.i)">
                      <span v-if="editingTextId !== item.i" :style="{ fontSize: (getItem(item.i).fontSize || 14) + 'px', fontWeight: getItem(item.i).bold ? 'bold' : 'normal', color: getItem(item.i).color || '#333' }">{{ getItem(item.i).text || 'Double-click to edit' }}</span>
                      <input v-else :value="getItem(item.i).text" @input="updateTextInput(item.i, $event.target.value)"
                        @blur="editingTextId = null" @keydown.enter="editingTextId = null"
                        class="border-none outline-none bg-transparent p-0 m-0 min-w-[100px] w-full"
                        :style="{ fontSize: (getItem(item.i).fontSize || 14) + 'px', fontWeight: getItem(item.i).bold ? 'bold' : 'normal', color: getItem(item.i).color || '#333' }" autofocus />
                    </template>
                  </div>
                </template>
              </div>
            </GridItem>
          </GridLayout>
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
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Mark as KPI</label><button @click="emitUpdate('_isKPI', !selectedItem._isKPI)" class="w-full border rounded-md p-1.5 text-sm font-medium transition-colors" :class="selectedItem._isKPI ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'"><span v-if="selectedItem._isKPI">★ KPI</span><span v-else>☆ Not a KPI</span></button></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Sort</label><select :value="selectedItem.sortDir" @change="emitUpdate('sortDir', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="DESC">Highest first</option><option value="ASC">Lowest first</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Rows</label><input :value="selectedItem.limit" @input="emitUpdate('limit', Number($event.target.value)||50)" type="number" min="1" max="500" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Filter</label><input :value="selectedItem.filter" @input="emitUpdate('filter', $event.target.value)" type="text" placeholder='e.g. &quot;Region&quot; = &apos;West&apos;' class="w-full border rounded-md p-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div class="pt-2 border-t"><button @click="downloadImage(selectedItem)" class="w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded py-1.5 font-medium">Download PNG</button></div>
        </div>
        <div v-if="selectedItem?._type === 'table'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Title</label><input :value="selectedItem.title" @input="emitTableUpdate('title', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Source table</label><select :value="selectedItem.tableName" @change="emitTableUpdate('tableName', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Columns</label><div class="flex flex-wrap gap-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-1.5"><button v-for="c in getTableColumns(selectedItem.tableName)" :key="c.name" @click="toggleTableColumn(c.name)" class="text-xs rounded px-2 py-0.5 transition-colors" :class="selectedItem.columns?.includes(c.name) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">{{ c.name }}</button></div></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Sort by</label><select :value="selectedItem.sortCol" @change="emitTableUpdate('sortCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">None</option><option v-for="c in selectedItem.columns || []" :key="c" :value="c">{{ c }}</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Direction</label><select :value="selectedItem.sortDir" @change="emitTableUpdate('sortDir', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="DESC">Descending</option><option value="ASC">Ascending</option></select></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Max rows</label><input :value="selectedItem.limit" @input="emitTableUpdate('limit', Number($event.target.value)||100)" type="number" min="1" max="5000" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Filter</label><input :value="selectedItem.filter" @input="emitTableUpdate('filter', $event.target.value)" type="text" placeholder='e.g. &quot;Region&quot; = &apos;West&apos;' class="w-full border rounded-md p-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div class="pt-2 border-t"><button @click="emitTableUpdate('delete', true)" class="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded py-1.5 font-medium">Delete table</button></div>
        </div>
        <div v-if="selectedItem?._type === 'text'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Content</label><textarea :value="selectedItem.text" @input="emitTextUpdate('text', $event.target.value)" rows="3" class="w-full border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Font size</label><select :value="selectedItem.fontSize" @change="emitTextUpdate('fontSize', Number($event.target.value))" class="w-full border rounded-md p-1.5 text-sm bg-white"><option v-for="s in [10,12,14,16,18,20,24,28,32,36,48]" :key="s" :value="s">{{ s }}px</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Bold</label><button @click="emitTextUpdate('bold', !selectedItem.bold)" class="w-full border rounded-md p-1.5 text-sm font-bold" :class="selectedItem.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'">B</button></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Color</label><div class="flex gap-1 flex-wrap"><button v-for="c in ['#333','#666','#999','#c00','#080','#06c','#60c','#c60']" :key="c" @click="emitTextUpdate('color', c)" class="w-6 h-6 rounded border border-gray-200" :class="selectedItem.color===c?'ring-2 ring-blue-500':''" :style="{backgroundColor:c}"></button></div></div>
          <div class="pt-2 border-t"><button @click="deleteTextItem(selectedItem.id)" class="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded py-1.5 font-medium">Delete text</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { GridLayout, GridItem } from 'vue-grid-layout-v3'

import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'vue-chartjs'
import { useReport } from '../composables/useReport'

const props = defineProps({
  tables: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  viewOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-view'])

const {
  charts, texts, canvasTables,
  addChart, removeChart,
  addCanvasTable, removeCanvasTable,
  addTextItem, removeTextItem,
  onChartUpdate, onCanvasTableUpdate, onTextUpdate,
} = useReport()

const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'polarArea', 'radar']
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
const chartRefs = {}

const layout = ref([])
const selectedId = ref(null)
const editingTextId = ref(null)
const sidebarTab = ref('properties')

const selectedItem = computed(() => {
  if (!selectedId.value) return null
  const c = charts.value.find(x => x.id === selectedId.value)
  if (c) return c
  const tbl = canvasTables.value.find(x => x.id === selectedId.value)
  if (tbl) return tbl
  return texts.value.find(x => x.id === selectedId.value) || null
})

function getItem(id) {
  if (!id) return null
  const c = charts.value.find(x => x.id === id)
  if (c) return c
  const tbl = canvasTables.value.find(x => x.id === id)
  if (tbl) return tbl
  return texts.value.find(x => x.id === id) || null
}

function syncLayoutFromData() {
  const items = []
  for (const c of charts.value) {
    items.push({ i: c.id, x: c.gridX ?? 0, y: c.gridY ?? items.length, w: c.gridW ?? 6, h: c.gridH ?? 8, minW: 3, minH: 4 })
  }
  for (const t of canvasTables.value) {
    items.push({ i: t.id, x: t.gridX ?? 0, y: t.gridY ?? items.length, w: t.gridW ?? 7, h: t.gridH ?? 8, minW: 4, minH: 4 })
  }
  for (const t of texts.value) {
    items.push({ i: t.id, x: t.gridX ?? 0, y: t.gridY ?? items.length, w: t.gridW ?? 3, h: t.gridH ?? 1, minW: 1, minH: 1 })
  }
  layout.value = items
}

let ignoreLayoutUpdate = false

function onLayoutUpdated(newLayout) {
  if (ignoreLayoutUpdate) return
  for (const node of newLayout) {
    const c = charts.value.find(x => x.id === node.i)
    if (c) { c.gridX = node.x; c.gridY = node.y; c.gridW = node.w; c.gridH = node.h; continue }
    const tbl = canvasTables.value.find(x => x.id === node.i)
    if (tbl) { tbl.gridX = node.x; tbl.gridY = node.y; tbl.gridW = node.w; tbl.gridH = node.h; continue }
    const tx = texts.value.find(x => x.id === node.i)
    if (tx) { tx.gridX = node.x; tx.gridY = node.y; tx.gridW = node.w; tx.gridH = node.h }
  }
}

function addChartItem() {
  addChart()
  nextTick(() => {
    ignoreLayoutUpdate = true
    const c = charts.value[charts.value.length - 1]
    if (c) layout.value = [...layout.value, { i: c.id, x: c.gridX, y: c.gridY, w: c.gridW, h: c.gridH, minW: 3, minH: 4 }]
    nextTick(() => { ignoreLayoutUpdate = false })
  })
}

function addTableItem() {
  addCanvasTable()
  nextTick(() => {
    ignoreLayoutUpdate = true
    const t = canvasTables.value[canvasTables.value.length - 1]
    if (t) layout.value = [...layout.value, { i: t.id, x: t.gridX, y: t.gridY, w: t.gridW, h: t.gridH, minW: 4, minH: 4 }]
    nextTick(() => { ignoreLayoutUpdate = false })
  })
}

function addTextItemClick() {
  addTextItem()
  nextTick(() => {
    ignoreLayoutUpdate = true
    const t = texts.value[texts.value.length - 1]
    if (t) layout.value = [...layout.value, { i: t.id, x: t.gridX, y: t.gridY, w: t.gridW, h: t.gridH, minW: 1, minH: 1 }]
    nextTick(() => { ignoreLayoutUpdate = false })
  })
}

function removeChartItem(id) {
  removeChart(id)
  layout.value = layout.value.filter(item => item.i !== id)
  if (selectedId.value === id) selectedId.value = null
}

function removeTableItem(id) {
  removeCanvasTable(id)
  layout.value = layout.value.filter(item => item.i !== id)
  if (selectedId.value === id) selectedId.value = null
}

function removeTextLayoutItem(id) {
  removeTextItem(id)
  layout.value = layout.value.filter(item => item.i !== id)
  if (selectedId.value === id) selectedId.value = null
}

function updateTextInput(id, text) {
  onTextUpdate({ id, key: 'text', value: text })
}

function deleteTextItem(id) {
  removeTextLayoutItem(id)
  if (selectedId.value === id) selectedId.value = null
}

function emitUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'chart') onChartUpdate({ id: item.id, key, value })
}

function emitTableUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'table') {
    if (key === 'delete') { removeCanvasTable(item.id); selectedId.value = null; return }
    onCanvasTableUpdate({ id: item.id, key, value })
  }
}

function toggleTableColumn(colName) {
  const item = selectedItem.value
  if (!item || item._type !== 'table') return
  const cols = item.columns?.includes(colName)
    ? item.columns.filter(c => c !== colName)
    : [...(item.columns || []), colName]
  onCanvasTableUpdate({ id: item.id, key: 'columns', value: cols })
}

function getTableColumns(tableName) {
  const t = props.tables.find(x => x.name === tableName)
  return t?.columns || []
}

function emitTextUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'text') onTextUpdate({ id: item.id, key, value })
}

async function downloadImage(chart) {
  const ref = chartRefs[chart.id]; if (!ref?.chart) return
  const url = ref.chart.toBase64Image('image/png', 1)
  const a = document.createElement('a'); a.href = url; a.download = (chart.title || 'chart').replace(/[^a-z0-9]/gi, '_') + '.png'; a.click()
}

async function captureAllImages() {
  const images = []
  for (const chart of charts.value) {
    const ref = chartRefs[chart.id]; if (!ref?.chart) continue
    try { images.push({ id: chart.id, dataUrl: ref.chart.toBase64Image('image/png', 2), title: chart.title, chartType: chart.chartType, agg: chart.agg, yCol: chart.yCol, xCol: chart.xCol, table: chart.table, queryResult: chart.queryResult, _fromPivot: chart._fromPivot, _pivotRef: chart._pivotRef, _pivotHeaders: chart._pivotHeaders, _isKPI: chart._isKPI }) } catch {}
  }
  for (const tbl of canvasTables.value) {
    if (tbl.queryResult && tbl.queryResult.length) {
      images.push({ id: tbl.id, dataUrl: '', title: tbl.title, chartType: 'table', queryResult: tbl.queryResult, columns: tbl.columns, tableName: tbl.tableName })
    }
  }
  return images
}

async function handleKeydown(e) {
  const item = selectedItem.value
  if (!item) {
    if (e.key === 'Escape') { selectedId.value = null; e.preventDefault() }
    return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (item._type === 'chart') removeChartItem(item.id)
    else if (item._type === 'table') removeTableItem(item.id)
    else if (item._type === 'text') removeTextLayoutItem(item.id)
    e.preventDefault()
  }
  if (e.key === 'Escape') {
    selectedId.value = null
    e.preventDefault()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    navigator.clipboard.writeText(JSON.stringify(item))
    e.preventDefault()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text)
      if (parsed._type) {
        parsed.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
        parsed.gridX = (parsed.gridX || 0) + 2
        parsed.gridY = (parsed.gridY || 0) + 2
        if (parsed._type === 'chart') { addChart(); nextTick(() => syncLayoutFromData()) }
        else if (parsed._type === 'table') { addCanvasTable(); nextTick(() => syncLayoutFromData()) }
        else if (parsed._type === 'text') { addTextItem(); nextTick(() => syncLayoutFromData()) }
      }
    } catch {}
    e.preventDefault()
  }
}

watch([() => charts.value.length, () => texts.value.length, () => canvasTables.value.length], () => {
  nextTick(syncLayoutFromData)
})

onMounted(() => {
  syncLayoutFromData()
})

defineExpose({ captureAllImages })
</script>

<style>
.vue-grid-item { transition: all .2s ease; transition-property: left, top, right; }
.vue-grid-item.no-touch { touch-action: none; }
.vue-grid-item.cssTransforms { transition-property: transform; left: 0; right: auto; }
.vue-grid-item.cssTransforms.render-rtl { left: auto; right: 0; }
.vue-grid-item.resizing { opacity: .6; z-index: 3; }
.vue-grid-item.vue-draggable-dragging { transition: none; z-index: 3; }
.vue-grid-item.vue-grid-placeholder { background: red; opacity: .2; transition-duration: .1s; z-index: 2; -webkit-user-select: none; user-select: none; }
.vue-grid-item > .vue-resizable-handle { position: absolute; width: 20px; height: 20px; bottom: 0; right: 0; background: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=); background-position: bottom right; padding: 0 3px 3px 0; background-repeat: no-repeat; background-origin: content-box; box-sizing: border-box; cursor: se-resize; }
.vue-grid-item > .vue-rtl-resizable-handle { position: absolute; width: 20px; height: 20px; bottom: 0; left: 0; background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwIEwxMCAwIEwxMCAxMCBaIiBmaWxsPSIjMDAwIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=); background-position: bottom left; padding: 0 0 3px 3px; background-repeat: no-repeat; background-origin: content-box; box-sizing: border-box; cursor: sw-resize; }
</style>

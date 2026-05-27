<template>
  <div class="flex gap-4 h-full" style="min-height:500px">
    <div :class="viewOnly ? 'w-full' : 'flex-1 flex flex-col min-h-0'">
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col flex-1 min-h-0" :class="viewOnly ? 'border-0 rounded-none' : ''">
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Canvas</span>
            <span class="text-xs text-gray-400">{{ charts.length + canvasTables.length + texts.length }} items</span>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="!viewOnly">
              <button @click="zoomOut" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">-</button>
              <span class="text-xs text-gray-500 w-8 text-center">{{ Math.round(scale * 100) }}%</span>
              <button @click="zoomIn" class="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100">+</button>
              <div class="w-px h-4 bg-gray-200 mx-1"></div>
              <button @click="$emit('add-chart')" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700">+ Chart</button>
              <button @click="$emit('add-table')" class="bg-violet-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-violet-700">+ Table</button>
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

        <div ref="containerRef" class="flex-1 relative overflow-hidden select-none" tabindex="0" @keydown="onKeyDown">
          <!-- Hidden Chart.js renders -->
          <div class="absolute" style="left:-9999px;top:-9999px;pointer-events:none;opacity:0">
            <template v-for="chart in charts" :key="'cr-'+chart.id">
            <div v-if="chart.chartData" :style="{ width:(chart.width||400)+'px', height:(chart.height||300)+'px' }">
              <Bar v-if="chart.chartType==='bar'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
              <Line v-if="chart.chartType==='line'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
              <Pie v-if="chart.chartType==='pie'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
              <Doughnut v-if="chart.chartType==='doughnut'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
              <PolarArea v-if="chart.chartType==='polarArea'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
              <Radar v-if="chart.chartType==='radar'" :ref="r => chartInstances[chart.id]=r" :data="chart.chartData" :options="chartOptions" />
            </div>
          </template>
          </div>

          <!-- Konva Stage -->
          <Stage ref="stageRef" :config="stageConfig" @wheel="handleWheel" @click="handleStageClick" @mousedown="handleStageMouseDown">
            <Layer>
              <Rect :config="gridConfig" />
            </Layer>
            <Layer>
              <!-- Charts -->
              <Group v-for="c in charts" :key="c.id"
                :ref="el => setNodeRef(c.id, el)"
                :config="{ x:c.x, y:c.y, draggable:!viewOnly, name:'item-'+c.id }"
                @click="e => handleItemClick(e, c.id)"
                @dragend="e => handleDragEnd(e, c, 'update')"
                @transformend="e => handleChartTransform(e, c)">
                <VImage v-if="chartImageObjs[c.id]" :config="{ image:chartImageObjs[c.id], width:c.width||400, height:c.height||300 }" />
                <Text v-else :config="chartPlaceholderCfg(c)" />
              </Group>
              <!-- Tables -->
              <Group v-for="t in canvasTables" :key="t.id"
                :ref="el => setNodeRef(t.id, el)"
                :config="{ x:t.x, y:t.y, draggable:!viewOnly, name:'item-'+t.id }"
                @click="e => handleTableClick(e, t)"
                @dblclick="e => handleTableDblClick(e, t)"
                @dragend="e => handleDragEnd(e, t, 'table-update')"
                @transformend="e => handleTableTransform(e, t)"
                @mousemove="e => handleTableHover(e, t)">
                <Rect :config="{ width:t.width, height:tComputedH(t), fill:'#fff', stroke:'#d1d5db', strokeWidth:1, cornerRadius:4 }" />
                <template v-for="(col, ci) in t.displayColumns" :key="'hdr-'+ci">
                  <Rect :config="{ x:colX(t,ci), y:0, width:col.width, height:HEADER_H, fill:'#1F4E79', stroke:'#e5e7eb', strokeWidth:0.5 }" />
                  <Text :config="{ x:colX(t,ci)+6, y:0, width:col.width-8, height:HEADER_H, text:col.name, fontSize:11, fill:'#fff', fontStyle:'bold', verticalAlign:'middle', ellipsis:true }" />
                </template>
                <template v-for="(row, ri) in visibleRows(t)" :key="'row-'+ri">
                  <template v-for="(val, ci) in row" :key="'cel-'+ri+'-'+ci">
                    <Rect :config="tabCellBg(t, ri, ci)" />
                    <Text :config="tabCellTx(t, ri, ci)" />
                  </template>
                </template>
                <Rect v-if="t.selectedCell && t.selectedCell.row >= 0" :config="tabSel(t)" />
                <template v-if="!viewOnly" v-for="(col, ci) in t.displayColumns" :key="'rh-'+ci">
                  <Rect v-if="ci < t.displayColumns.length-1"
                    :config="{ x:colX(t,ci)+col.width-3, y:0, width:6, height:tComputedH(t), fill:'transparent', name:'resize-'+t.id+'-'+ci }"
                    @mousedown="e => startColResize(e, t, ci)" />
                </template>
              </Group>
              <!-- Texts -->
              <Group v-for="tx in texts" :key="tx.id"
                :ref="el => setNodeRef(tx.id, el)"
                :config="{ x:tx.x, y:tx.y, draggable:!viewOnly, name:'item-'+tx.id }"
                @click="e => handleItemClick(e, tx.id)"
                @dragend="e => handleDragEnd(e, tx, 'update-text')"
                @dblclick="e => startTextEdit(e, tx)">
                <Text :config="{ text:tx.text, fontSize:tx.fontSize||14, fill:tx.color||'#333', fontStyle:tx.bold?'bold':'normal' }" />
              </Group>
            </Layer>
            <Layer>
              <Transformer ref="transformerRef" :config="transformerCfg" />
            </Layer>
          </Stage>

          <!-- Cell/text editing input -->
          <input v-if="editState"
            ref="editInput"
            v-model="editValue"
            @blur="finishEdit"
            @keydown.enter="finishEdit"
            @keydown.escape="cancelEdit"
            class="absolute z-20 px-1.5 py-0.5 rounded outline-none border-2 border-blue-500 text-sm"
            :style="editStyle"
            autofocus />
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div v-if="!viewOnly" class="w-72 shrink-0 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
      <div class="flex border-b border-gray-100 bg-gray-50/50 shrink-0">
        <button @click="sidebarTab='properties'"
          class="flex-1 px-3 py-2.5 text-xs font-medium transition-colors text-center"
          :class="sidebarTab==='properties' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'">
          Properties
        </button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="!selectedItem" class="p-4 text-center text-gray-400 text-sm mt-8">Select an item to edit its properties</div>

        <!-- Chart properties -->
        <div v-if="selectedItem?._type==='chart'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Title</label><input :value="selectedItem.title" @input="emitUpdate('title', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">X axis</label><select :value="selectedItem.xCol" @change="emitUpdate('xCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option value="" disabled>Select column</option><option v-for="c in columns" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Y axis</label><select :value="selectedItem.yCol" @change="emitUpdate('yCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option value="" disabled>Select column</option><option v-for="c in numericColumns" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Calculation</label><select :value="selectedItem.agg" @change="emitUpdate('agg', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option v-for="a in ['SUM','AVG','COUNT','MIN','MAX']" :key="a" :value="a">{{ a }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Chart type</label><select :value="selectedItem.chartType" @change="emitUpdate('chartType', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white capitalize"><option v-for="t in chartTypes" :key="t" :value="t" class="capitalize">{{ t }}</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Sort</label><select :value="selectedItem.sortDir" @change="emitUpdate('sortDir', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option value="DESC">Highest first</option><option value="ASC">Lowest first</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Rows</label><input :value="selectedItem.limit" @input="emitUpdate('limit', Number($event.target.value)||50)" type="number" min="1" max="500" class="w-full border rounded-md p-1.5 text-sm" /></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Filter</label><input :value="selectedItem.filter" @input="emitUpdate('filter', $event.target.value)" type="text" placeholder='e.g. &quot;Region&quot; = &apos;West&apos;' class="w-full border rounded-md p-1.5 text-sm font-mono" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Position &amp; Size</label><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-gray-400 block">X</label><input :value="selectedItem.x" @change="emitUpdate('x', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">Y</label><input :value="selectedItem.y" @change="emitUpdate('y', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">W</label><input :value="selectedItem.width" @change="emitUpdate('width', Math.max(200,Number($event.target.value)||400))" type="number" min="200" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">H</label><input :value="selectedItem.height" @change="emitUpdate('height', Math.max(150,Number($event.target.value)||300))" type="number" min="150" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div></div></div>
          <div class="pt-2 border-t"><button @click="downloadChartImage(selectedItem)" class="w-full text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded py-1.5 font-medium">Download PNG</button></div>
        </div>

        <!-- Table properties -->
        <div v-if="selectedItem?._type==='table'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Title</label><input :value="selectedItem.title" @input="emitTableUpdate('title', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Data source</label><select :value="selectedItem.tableName" @change="emitTableUpdate('tableName', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option v-for="t in availableTables" :key="t.name" :value="t.name">{{ t.name }}</option></select></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Columns (multi-select)</label>
            <div class="border rounded-md p-1.5 text-sm max-h-32 overflow-y-auto space-y-1">
              <label v-for="c in tableColumnOptions" :key="c.name" class="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" :checked="selectedItem.displayColumns.some(d => d.name===c.name)" @change="toggleTableCol(selectedItem, c.name)" class="rounded" />
                <span>{{ c.name }}</span>
                <span class="text-gray-400">({{ c.type }})</span>
              </label>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Sort by</label><select :value="selectedItem.sortCol" @change="emitTableUpdate('sortCol', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option value="">None</option><option v-for="c in selectedItem.displayColumns" :key="c.name" :value="c.name">{{ c.name }}</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Direction</label><select :value="selectedItem.sortDir" @change="emitTableUpdate('sortDir', $event.target.value)" class="w-full border rounded-md p-1.5 text-sm bg-white"><option value="ASC">Ascending</option><option value="DESC">Descending</option></select></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Filter</label><input :value="selectedItem.filter" @input="emitTableUpdate('filter', $event.target.value)" type="text" class="w-full border rounded-md p-1.5 text-sm font-mono" /></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Limit rows</label><input :value="selectedItem.limit" @input="emitTableUpdate('limit', Number($event.target.value)||100)" type="number" min="1" max="1000" class="w-full border rounded-md p-1.5 text-sm" /></div>

          <!-- Cell formatting -->
          <template v-if="selectedCellFormat">
            <div class="border-t pt-3 mt-3">
              <label class="text-xs font-semibold text-gray-500 mb-2 block">Cell Formatting</label>
              <div class="text-xs text-gray-400 mb-2">Cell ({{ selectedItem.selectedCell.row }}, {{ selectedItem.selectedCell.col }})</div>
              <div class="flex items-center gap-2 mb-2">
                <button @click="updateCellFormat('bold', !selectedCellFormat.bold)"
                  class="w-8 h-7 rounded text-xs font-bold border transition-colors"
                  :class="selectedCellFormat.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">B</button>
                <select :value="selectedCellFormat.format || 'general'" @change="updateCellFormat('format', $event.target.value)"
                  class="flex-1 border rounded text-xs p-1 bg-white">
                  <option value="general">General</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency</option>
                  <option value="percent">Percent</option>
                </select>
              </div>
              <div class="flex items-center gap-1 mb-2">
                <button @click="updateCellFormat('align', 'left')" title="Left align"
                  class="w-7 h-7 rounded text-xs border transition-colors flex items-center justify-center"
                  :class="(selectedCellFormat.align||'left')==='left' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'">L</button>
                <button @click="updateCellFormat('align', 'center')" title="Center align"
                  class="w-7 h-7 rounded text-xs border transition-colors flex items-center justify-center"
                  :class="selectedCellFormat.align==='center' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'">C</button>
                <button @click="updateCellFormat('align', 'right')" title="Right align"
                  class="w-7 h-7 rounded text-xs border transition-colors flex items-center justify-center"
                  :class="selectedCellFormat.align==='right' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'">R</button>
                <div class="w-px h-5 bg-gray-200 mx-1"></div>
                <label class="relative flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  A
                  <input type="color" :value="selectedCellFormat.color || '#374151'" @input="updateCellFormat('color', $event.target.value)"
                    class="w-5 h-5 p-0 border-0 cursor-pointer" />
                </label>
                <label class="relative flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                  <span class="w-4 h-4 rounded border border-gray-300" :style="{backgroundColor: selectedCellFormat.bgColor || '#ffffff'}"></span>
                  <input type="color" :value="selectedCellFormat.bgColor || '#ffffff'" @input="updateCellFormat('bgColor', $event.target.value)"
                    class="w-0 h-0 p-0 opacity-0 absolute" />
                </label>
              </div>
            </div>
          </template>

          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Position &amp; Size</label><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-gray-400 block">X</label><input :value="selectedItem.x" @change="emitTableUpdate('x', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">Y</label><input :value="selectedItem.y" @change="emitTableUpdate('y', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">W</label><input :value="selectedItem.width" @change="emitTableUpdate('width', Math.max(300,Number($event.target.value)||480))" type="number" min="300" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">H</label><input :value="selectedItem.height" @change="emitTableUpdate('height', Math.max(100,Number($event.target.value)||300))" type="number" min="100" step="10" class="w-full border rounded-md p-1.5 text-sm" /></div></div></div>
        </div>

        <!-- Text properties -->
        <div v-if="selectedItem?._type==='text'" class="p-4 space-y-4">
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Content</label><textarea :value="selectedItem.text" @input="emitTextUpdate('text', $event.target.value)" rows="3" class="w-full border rounded-md p-1.5 text-sm"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Font size</label><select :value="selectedItem.fontSize" @change="emitTextUpdate('fontSize', Number($event.target.value))" class="w-full border rounded-md p-1.5 text-sm bg-white"><option v-for="s in [10,12,14,16,18,20,24,28,32,36,48]" :key="s" :value="s">{{ s }}px</option></select></div>
            <div><label class="text-xs font-medium text-gray-500 mb-1 block">Bold</label><button @click="emitTextUpdate('bold', !selectedItem.bold)" class="w-full border rounded-md p-1.5 text-sm font-bold" :class="selectedItem.bold ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'">B</button></div>
          </div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Color</label><div class="flex gap-1 flex-wrap"><button v-for="c in ['#333','#666','#999','#c00','#080','#06c','#60c','#c60']" :key="c" @click="emitTextUpdate('color', c)" class="w-6 h-6 rounded border border-gray-200" :class="selectedItem.color===c?'ring-2 ring-blue-500':''" :style="{backgroundColor:c}"></button></div></div>
          <div><label class="text-xs font-medium text-gray-500 mb-1 block">Position</label><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-gray-400 block">X</label><input :value="selectedItem.x" @change="emitTextUpdate('x', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div><div><label class="text-xs text-gray-400 block">Y</label><input :value="selectedItem.y" @change="emitTextUpdate('y', Math.max(0,Number($event.target.value)||0))" type="number" class="w-full border rounded-md p-1.5 text-sm" /></div></div></div>
          <div class="pt-2 border-t"><button @click="$emit('delete-text', selectedItem.id)" class="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded py-1.5 font-medium">Delete text</button></div>
        </div>
        <div v-if="selectedItem?._type==='table'" class="px-4 pb-4 pt-0 -mt-2">
          <div class="pt-2 border-t"><button @click="$emit('remove-table', selectedItem.id)" class="w-full text-xs text-red-500 bg-red-50 hover:bg-red-100 rounded py-1.5 font-medium">Delete table</button></div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Stage, Layer, Rect, Group, Text, Image as VImage, Transformer } from 'vue-konva'
import { Bar, Line, Pie, Doughnut, PolarArea, Radar } from 'vue-chartjs'
// ─── Props ──────────────────────────────────────────────────────
const props = defineProps({
  charts: { type: Array, default: () => [] },
  canvasTables: { type: Array, default: () => [] },
  texts: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  numericColumns: { type: Array, default: () => [] },
  availableTables: { type: Array, default: () => [] },
  viewOnly: { type: Boolean, default: false },
})
const emit = defineEmits(['update', 'add-chart', 'remove-chart', 'add-table', 'remove-table', 'table-update',
  'update-text', 'add-text', 'delete-text', 'toggle-view', 'auto-layout'])

const chartTypes = ['bar', 'line', 'pie', 'doughnut', 'polarArea', 'radar']
const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }

// ─── Constants ──────────────────────────────────────────────────
const HEADER_H = 30
const ROW_H = 26
const CANVAS_W = 6000
const CANVAS_H = 6000

// ─── State ──────────────────────────────────────────────────────
const containerRef = ref(null)
const stageRef = ref(null)
const transformerRef = ref(null)
const editInput = ref(null)
const selectedId = ref(null)
const scale = ref(1)
const stagePos = reactive({ x: 0, y: 0 })
const stageSize = reactive({ width: 1000, height: 600 })

const chartInstances = {}
const chartImageObjs = reactive({})
const nodeRefs = {}

// Column resize state
let colResizeState = null
// Drag state
let dragState = null
// Pan state
let isPanning = false
let panStart = { x: 0, y: 0 }
let panStartPos = { x: 0, y: 0 }

// ─── Edit state ────────────────────────────────────────────────
const editState = ref(null) // { type: 'cell'|'text', item, row?, col? }
const editValue = ref('')
const editStyle = ref({})

// ─── Computed ──────────────────────────────────────────────────
const selectedItem = computed(() => {
  if (!selectedId.value) return null
  const itemType = findItemType(selectedId.value)
  if (itemType === 'chart') return props.charts.find(c => c.id === selectedId.value)
  if (itemType === 'table') return props.canvasTables.find(t => t.id === selectedId.value)
  if (itemType === 'text') return props.texts.find(t => t.id === selectedId.value)
  return null
})

function findItemType(id) {
  if (props.charts.some(c => c.id === id)) return 'chart'
  if (props.canvasTables.some(t => t.id === id)) return 'table'
  if (props.texts.some(t => t.id === id)) return 'text'
  return null
}

const tableColumnOptions = computed(() => {
  const sel = selectedItem.value
  if (sel?._type !== 'table') return []
  const t = props.availableTables.find(x => x.name === sel.tableName)
  return t?.columns || []
})

const selectedCellFormat = computed(() => {
  const t = selectedItem.value
  if (t?._type !== 'table' || !t.selectedCell || t.selectedCell.row < 0) return null
  const key = t.selectedCell.row + '-' + t.selectedCell.col
  if (!t.cellFormats) t.cellFormats = {}
  if (!t.cellFormats[key]) t.cellFormats[key] = {}
  return t.cellFormats[key]
})

function updateCellFormat(prop, value) {
  const fmt = selectedCellFormat.value
  if (!fmt) return
  fmt[prop] = value
}

function colX(t, ci) {
  let x = 0
  for (let i = 0; i < ci; i++) x += t.displayColumns[i].width
  return x
}

function tComputedH(t) {
  return HEADER_H + Math.min(t.rows.length, maxVisibleRows(t)) * ROW_H
}

function maxVisibleRows(t) {
  return Math.max(1, Math.floor((t.height - HEADER_H) / ROW_H))
}

function visibleRows(t) {
  return t.rows.slice(0, maxVisibleRows(t))
}

// ─── Configs ───────────────────────────────────────────────────
const stageConfig = computed(() => ({
  width: stageSize.width,
  height: stageSize.height,
  scaleX: scale.value,
  scaleY: scale.value,
  x: stagePos.x,
  y: stagePos.y,
}))

const transformerCfg = {
  borderStroke: '#3B82F6',
  borderStrokeWidth: 2,
  anchorFill: '#fff',
  anchorStroke: '#3B82F6',
  anchorSize: 8,
  anchorCornerRadius: 2,
  rotateEnabled: false,
  enabledAnchors: ['top-left','top-right','bottom-left','bottom-right'],
  keepRatio: false,
  boundBoxFunc: (o, n) => (n.width < 100 || n.height < 60) ? o : n,
}

const gridConfig = computed(() => ({
  x: 0, y: 0, width: CANVAS_W, height: CANVAS_H,
  fill: '#fafafa',
  stroke: '#e5e7eb',
  strokeWidth: 1,
}))

function chartPlaceholderCfg(c) {
  const txt = c._loading ? 'Loading...' : c._error || 'Select columns'
  return { text: txt, fontSize: 12, fill: '#9ca3af', width: c.width || 400, height: c.height || 300, align: 'center', verticalAlign: 'middle' }
}

// ─── Table cell configs ────────────────────────────────────────
function tabCellBg(t, ri, ci) {
  const x = colX(t, ci)
  const y = HEADER_H + ri * ROW_H
  const even = ri % 2 === 0
  const sel = t.selectedCell && t.selectedCell.row === ri && t.selectedCell.col === ci
  const fmt = t.cellFormats?.[ri + '-' + ci]
  const bg = fmt?.bgColor || (sel ? '#DBEAFE' : even ? '#ffffff' : '#F9FAFB')
  return { x, y, width: t.displayColumns[ci].width, height: ROW_H, fill: bg, stroke: '#e5e7eb', strokeWidth: 0.5 }
}

function tabCellTx(t, ri, ci) {
  const x = colX(t, ci)
  const y = HEADER_H + ri * ROW_H
  const fmt = t.cellFormats?.[ri + '-' + ci]
  const isNum = /^[\d,.kMB%$€£¥]+$/.test(String(t.rows[ri][ci]))
  const align = fmt?.align || (isNum ? 'right' : 'left')
  return {
    x: x + 6, y, width: t.displayColumns[ci].width - 8, height: ROW_H,
    text: String(t.rows[ri][ci] ?? ''), fontSize: 11,
    fill: fmt?.color || '#374151',
    fontStyle: fmt?.bold ? 'bold' : 'normal',
    verticalAlign: 'middle', ellipsis: true, align,
  }
}

function tabSel(t) {
  const { row, col } = t.selectedCell
  const x = colX(t, col)
  const y = HEADER_H + row * ROW_H
  return { x, y, width: t.displayColumns[col].width, height: ROW_H, stroke: '#3B82F6', strokeWidth: 2 }
}

// ─── Node refs ─────────────────────────────────────────────────
function setNodeRef(id, el) {
  if (el && el.getNode) nodeRefs[id] = el.getNode()
  else delete nodeRefs[id]
}

function selectedNode() { return selectedId.value ? nodeRefs[selectedId.value] : null }

function updateTransformer() {
  const tr = transformerRef.value?.getNode()
  if (!tr) return
  const node = selectedNode()
  tr.nodes(node ? [node] : [])
  tr.getLayer()?.batchDraw()
}

// ─── Chart image capture ───────────────────────────────────────
function captureChartImage(chart) {
  const inst = chartInstances[chart.id]
  if (!inst?.chart || !chart.chartData) return
  try {
    const url = inst.chart.toBase64Image('image/png', 0.8)
    const img = new window.Image()
    img.onload = () => { chartImageObjs[chart.id] = img; stageRef.value?.getNode()?.batchDraw() }
    img.src = url
  } catch {}
}

watch(() => props.charts.map(c => c.chartData), () => {
  nextTick(() => {
    props.charts.forEach(c => {
      if (c.chartData && !c._loading) captureChartImage(c)
    })
  })
}, { deep: true })

// ─── Click handlers ────────────────────────────────────────────
function handleItemClick(e, id) {
  e.cancelBubble = true
  if (editState.value) return
  selectedId.value = id
  updateTransformer()
}

function handleStageClick() {
  if (editState.value) return
  selectedId.value = null
  updateTransformer()
}

// ─── Table click ───────────────────────────────────────────────
function relPos(e) {
  const stage = stageRef.value?.getNode()
  if (!stage) return null
  const ptr = stage.getPointerPosition()
  if (!ptr) return null
  return {
    x: (ptr.x - stagePos.x) / scale.value,
    y: (ptr.y - stagePos.y) / scale.value,
  }
}

function tableCellAt(e, t) {
  const rp = relPos(e)
  if (!rp) return null
  const rx = rp.x - t.x
  const ry = rp.y - t.y
  if (rx < 0 || ry < 0) return null
  if (ry < HEADER_H) {
    let cx = 0
    for (let ci = 0; ci < t.displayColumns.length; ci++) {
      cx += t.displayColumns[ci].width
      if (rx < cx) return { row: -1, col: ci }
    }
    return { row: -1, col: t.displayColumns.length - 1 }
  }
  const ri = Math.floor((ry - HEADER_H) / ROW_H)
  if (ri < 0 || ri >= t.rows.length) return null
  let cx = 0
  for (let ci = 0; ci < t.displayColumns.length; ci++) {
    cx += t.displayColumns[ci].width
    if (rx < cx) return { row: ri, col: ci }
  }
  return { row: ri, col: t.displayColumns.length - 1 }
}

function handleTableClick(e, t) {
  e.cancelBubble = true
  if (editState.value) return
  const cell = tableCellAt(e, t)
  t.selectedCell = cell
  selectedId.value = t.id
  updateTransformer()
}

function handleTableDblClick(e, t) {
  if (props.viewOnly) return
  e.cancelBubble = true
  const cell = tableCellAt(e, t)
  if (!cell || cell.row < 0) return
  t.selectedCell = cell
  startCellEdit(t, cell.row, cell.col)
}

// ─── Column resize ─────────────────────────────────────────────
function handleTableHover(e, t) {
  if (colResizeState || !containerRef.value) return
  const rp = relPos(e)
  if (!rp) return
  const rx = rp.x - t.x
  const ry = rp.y - t.y
  let cx = 0
  for (let ci = 0; ci < t.displayColumns.length - 1; ci++) {
    cx += t.displayColumns[ci].width
    if (ry >= 0 && ry < tComputedH(t) && Math.abs(rx - cx) < 4) {
      containerRef.value.style.cursor = 'col-resize'
      return
    }
  }
  containerRef.value.style.cursor = ''
}

function startColResize(e, t, ci) {
  if (props.viewOnly) return
  e.cancelBubble = true
  const rp = relPos(e)
  if (!rp) return
  colResizeState = { t, ci, startX: rp.x }
  e.evt.preventDefault()
}

// ─── Drag handlers ─────────────────────────────────────────────
function handleDragEnd(e, item, eventName) {
  const node = e.target
  item.x = Math.round(node.x() / 10) * 10
  item.y = Math.round(node.y() / 10) * 10
  node.x(item.x); node.y(item.y)
  if (item._type === 'chart') emit('update', { id: item.id, key: 'x', value: item.x })
  if (item._type === 'table') emit('table-update', { id: item.id, key: 'x', value: item.x })
  if (item._type === 'text') emit('update-text', { id: item.id, key: 'x', value: item.x })
  updateTransformer()
}

function handleChartTransform(e, c) {
  const node = e.target
  c.width = Math.max(200, Math.round(node.width() * node.scaleX()))
  c.height = Math.max(150, Math.round(node.height() * node.scaleY()))
  node.width(c.width); node.height(c.height)
  node.scaleX(1); node.scaleY(1)
  emit('update', { id: c.id, key: 'width', value: c.width })
  emit('update', { id: c.id, key: 'height', value: c.height })
  nextTick(() => captureChartImage(c))
  updateTransformer()
}

function handleTableTransform(e, t) {
  const node = e.target
  t.width = Math.max(300, Math.round(node.width() * node.scaleX()))
  t.height = Math.max(100, Math.round(node.height() * node.scaleY()))
  node.width(t.width); node.height(t.height)
  node.scaleX(1); node.scaleY(1)
  emit('table-update', { id: t.id, key: 'width', value: t.width })
  updateTransformer()
}

// ─── Zoom & Pan ────────────────────────────────────────────────
function handleWheel(e) {
  e.evt.preventDefault()
  const stage = stageRef.value?.getNode()
  if (!stage) return
  const oldScale = scale.value
  const ptr = stage.getPointerPosition()
  if (!ptr) return
  const mp = { x: (ptr.x - stagePos.x) / oldScale, y: (ptr.y - stagePos.y) / oldScale }
  const dir = e.evt.deltaY > 0 ? 0.9 : 1.1
  const ns = Math.max(0.2, Math.min(3, oldScale * dir))
  scale.value = ns
  stagePos.x = ptr.x - mp.x * ns
  stagePos.y = ptr.y - mp.y * ns
  stage.scale({ x: ns, y: ns })
  stage.position({ x: stagePos.x, y: stagePos.y })
  stage.batchDraw()
}

function zoomIn() { adjustZoom(1.2) }
function zoomOut() { adjustZoom(1 / 1.2) }
function adjustZoom(f) {
  const s = stageRef.value?.getNode()
  if (!s) return
  scale.value = Math.max(0.2, Math.min(3, scale.value * f))
  s.scale({ x: scale.value, y: scale.value })
  s.batchDraw()
}

function handleStageMouseDown(e) {
  if (e.evt.button !== 1) return
  isPanning = true
  panStart = { x: e.evt.clientX, y: e.evt.clientY }
  panStartPos = { x: stagePos.x, y: stagePos.y }
  e.evt.preventDefault()
}

onMounted(() => {
  const el = containerRef.value
  if (!el) return
  el.addEventListener('mousemove', onMouseMoveGlobal)
  el.addEventListener('mouseup', onMouseUpGlobal)
  el.addEventListener('mouseleave', onMouseUpGlobal)
  el._ctxMenu = (e) => { if (e.button === 1) e.preventDefault() }
  el.addEventListener('contextmenu', el._ctxMenu)
})
onBeforeUnmount(() => {
  const el = containerRef.value
  if (!el) return
  el.removeEventListener('mousemove', onMouseMoveGlobal)
  el.removeEventListener('mouseup', onMouseUpGlobal)
  el.removeEventListener('mouseleave', onMouseUpGlobal)
  if (el._ctxMenu) el.removeEventListener('contextmenu', el._ctxMenu)
})

function onMouseMoveGlobal(e) {
  // Pan
  if (isPanning) {
    const s = stageRef.value?.getNode()
    if (!s) return
    stagePos.x = panStartPos.x + (e.clientX - panStart.x)
    stagePos.y = panStartPos.y + (e.clientY - panStart.y)
    s.position({ x: stagePos.x, y: stagePos.y })
    s.batchDraw()
    return
  }
  // Column resize
  if (colResizeState) {
    const stage = stageRef.value?.getNode()
    if (!stage) return
    const ptr = stage.getPointerPosition()
    if (!ptr) return
    const rp = { x: (ptr.x - stagePos.x) / scale.value, y: (ptr.y - stagePos.y) / scale.value }
    const t = colResizeState.t
    const dx = rp.x - colResizeState.startX
    const newW = Math.max(40, t.displayColumns[colResizeState.ci].width + dx)
    t.displayColumns[colResizeState.ci].width = newW
    colResizeState.startX = rp.x
    stage.batchDraw()
  }
}

function onMouseUpGlobal() {
  isPanning = false
  colResizeState = null
  containerRef.value ? containerRef.value.style.cursor = '' : null
}

// ─── Cell editing ──────────────────────────────────────────────
function startCellEdit(t, row, col) {
  editState.value = { type: 'cell', item: t, row, col }
  editValue.value = t.rows[row][col] || ''
  positionEditOverlay(t)
}

function positionEditOverlay(t) {
  nextTick(() => {
    if (!editState.value) return
    const { row, col } = editState.value
    const container = containerRef.value
    const stage = stageRef.value?.getNode()
    if (!container || !stage) return
    const cr = container.getBoundingClientRect()
    const rx = t.x + colX(t, col)
    const ry = t.y + HEADER_H + row * ROW_H
    editStyle.value = {
      left: (rx * scale.value + stagePos.x) + 'px',
      top: (ry * scale.value + stagePos.y) + 'px',
      width: (t.displayColumns[col].width * scale.value - 4) + 'px',
      height: (ROW_H * scale.value - 4) + 'px',
      fontSize: Math.round(11 * scale.value) + 'px',
    }
  })
}

function startTextEdit(e, tx) {
  e.cancelBubble = true
  editState.value = { type: 'text', item: tx }
  editValue.value = tx.text
  nextTick(() => {
    const container = containerRef.value
    const node = nodeRefs[tx.id]
    if (!container || !node) return
    const absPos = node.getAbsolutePosition()
    editStyle.value = {
      left: (absPos.x * scale.value + stagePos.x) + 'px',
      top: (absPos.y * scale.value + stagePos.y) + 'px',
      fontSize: Math.round((tx.fontSize || 14) * scale.value) + 'px',
      fontWeight: tx.bold ? 'bold' : 'normal',
      color: tx.color || '#333',
      minWidth: '60px',
    }
  })
}

function finishEdit() {
  if (!editState.value) return
  if (editState.value.type === 'cell') {
    const { item, row, col } = editState.value
    item.rows[row][col] = editValue.value
  } else if (editState.value.type === 'text') {
    emit('update-text', { id: editState.value.item.id, key: 'text', value: editValue.value })
  }
  editState.value = null
  stageRef.value?.getNode()?.batchDraw()
}

function cancelEdit() {
  editState.value = null
}

// ─── Text helpers ──────────────────────────────────────────────
function addText() { emit('add-text') }
function emitUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'chart') emit('update', { id: item.id, key, value })
}
function emitTableUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'table') emit('table-update', { id: item.id, key, value })
}
function emitTextUpdate(key, value) {
  const item = selectedItem.value
  if (item && item._type === 'text') emit('update-text', { id: item.id, key, value })
}

function toggleTableCol(t, colName) {
  const idx = t.displayColumns.findIndex(d => d.name === colName)
  let newCols
  if (idx >= 0) newCols = t.displayColumns.filter((_, i) => i !== idx)
  else newCols = [...t.displayColumns, { name: colName, width: 120 }]
  emit('table-update', { id: t.id, key: 'displayColumns', value: newCols })
}

async function downloadChartImage(chart) {
  const inst = chartInstances[chart.id]
  if (!inst?.chart) return
  const url = inst.chart.toBase64Image('image/png', 1)
  const a = document.createElement('a')
  a.href = url; a.download = (chart.title || 'chart').replace(/[^a-z0-9]/gi, '_') + '.png'; a.click()
}

// ─── Exposed methods for export ────────────────────────────────
async function captureAllImages() {
  const images = []
  for (const c of props.charts) {
    const inst = chartInstances[c.id]
    if (!inst?.chart) continue
    try {
      const dataUrl = inst.chart.toBase64Image('image/png', 0.8)
      images.push({ id: c.id, dataUrl, title: c.title, chartType: c.chartType, agg: c.agg, yCol: c.yCol, xCol: c.xCol, queryResult: c.queryResult })
    } catch {}
  }
  return images
}

async function captureScreenshot() {
  const stage = stageRef.value?.getNode()
  if (!stage) return null
  const savedScale = { x: stage.scaleX(), y: stage.scaleY() }
  const savedPos = { x: stage.x(), y: stage.y() }
  stage.scale({ x: 1, y: 1 }); stage.position({ x: 0, y: 0 })
  stage.batchDraw()
  await new Promise(r => setTimeout(r, 50))
  const url = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/png' })
  stage.scale(savedScale); stage.position(savedPos)
  stage.batchDraw()
  return url
}

defineExpose({ captureAllImages, captureScreenshot })

// ─── Keyboard ──────────────────────────────────────────────────
function onKeyDown(e) {
  if (editState.value) return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    if (!selectedId.value) return
    const type = findItemType(selectedId.value)
    if (type === 'chart') emit('remove-chart', selectedId.value)
    if (type === 'table') emit('remove-table', selectedId.value)
    if (type === 'text') emit('delete-text', selectedId.value)
    selectedId.value = null
    updateTransformer()
  }
  if (e.key === 'Escape') { selectedId.value = null; updateTransformer() }
}

// ─── Resize ────────────────────────────────────────────────────
function updateSize() {
  if (containerRef.value) {
    stageSize.width = containerRef.value.clientWidth
    stageSize.height = containerRef.value.clientHeight
  }
}
onMounted(updateSize)
onMounted(() => window.addEventListener('resize', updateSize))
onBeforeUnmount(() => window.removeEventListener('resize', updateSize))

// ─── Watch charts for column changes affecting dimensions ──────
watch(() => props.charts.length, () => {
  nextTick(() => props.charts.forEach(c => { if (c.chartData) captureChartImage(c) }))
})
</script>

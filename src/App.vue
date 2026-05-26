<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img :src="duckIconSrc" class="w-7 h-7" alt="Quack BI" />
          <span class="text-lg font-bold text-gray-800">Quack BI</span>
        </div>
        <nav class="flex items-center gap-1">
          <template v-for="(s, i) in steps" :key="i">
            <div class="flex items-center gap-1">
              <button @click="goToStep(i + 1)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                :class="stepButtonClass(i + 1)">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="stepBadgeClass(i + 1)">{{ i + 1 }}</span>
                <span class="hidden sm:inline">{{ s }}</span>
              </button>
            </div>
            <svg v-if="i < steps.length - 1" class="w-4 h-4 text-gray-300 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </template>
          <button @click="showAbout = true" class="ml-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="About">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path stroke-linecap="round" d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </nav>
      </div>
    </header>

    <!-- About modal -->
    <div v-if="showAbout" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="showAbout = false">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex items-center gap-3 mb-4">
          <img :src="duckIconSrc" class="w-10 h-10" alt="Quack BI" />
          <div>
            <h2 class="text-lg font-bold text-gray-800">Quack BI Lite</h2>
            <p class="text-xs text-gray-400">v0.0.0</p>
          </div>
        </div>
        <div class="text-sm text-gray-600 space-y-2">
          <p>A ducky little BI tool that lives entirely in your browser. Upload CSVs, explore with SQL, build dashboards, and export to Excel/PDF — all without sending data anywhere.</p>
          <p class="text-xs text-gray-400 pt-2">
            Built with Vue 3 &bull; DuckDB-WASM &bull; Chart.js &bull; 🤗 Transformers.js<br>
            <a href="https://github.com/RaoulHofmann/quack-bi-lite" class="text-blue-600 hover:underline">GitHub</a>
          </p>
        </div>
        <button @click="showAbout = false" class="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Close</button>
      </div>
    </div>

    <main class="max-w-7xl mx-auto p-6">
      <!-- Step 1: Upload -->
      <div v-if="currentStep === 1">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Upload your data</h2>
          <p class="text-sm text-gray-500 mt-1">You can upload multiple CSV files. Each file becomes a table you can query and join.</p>
        </div>

        <CsvUploader @uploaded="handleFileUpload" />

        <!-- Quick start with sample data -->
        <div v-if="!tables.length" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-gray-50 px-3 text-xs text-gray-400">or try it now</span>
            </div>
          </div>
          <button @click="loadSampleData" :disabled="loadingSamples"
            class="mt-4 w-full border-2 border-dashed border-purple-200 rounded-xl p-5 text-center hover:bg-purple-50 transition-colors bg-white disabled:opacity-40">
            <svg class="w-8 h-8 mx-auto text-purple-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <p class="font-medium text-purple-700 text-sm">Load sample data</p>
            <p class="text-xs text-purple-400 mt-1">Try it with {{ sampleFiles }} pre-made CSV files (sales, products, employees)</p>
          </button>
        </div>

        <!-- Loaded tables -->
        <div v-if="tables.length" class="mt-6 space-y-3">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Loaded tables</h3>
          <div v-for="t in tables" :key="t.name"
            class="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-700">{{ t.name }}</p>
              <p class="text-xs text-gray-400">{{ t.fileName }} &middot; {{ t.columns.length }} columns &middot; {{ t.rowCount }} rows</p>
            </div>
            <div class="text-xs text-gray-400">
              <button @click="removeTable(t.name)" class="text-red-400 hover:text-red-600 ml-3">Remove</button>
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button @click="goToStep(2)" :disabled="!tables.length"
              class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to build
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Explore -->
      <div v-if="currentStep === 2 && tables.length">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Explore your data</h2>
          <p class="text-sm text-gray-500 mt-1">Browse tables, profile columns, and run ad-hoc SQL queries before building charts.</p>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div class="xl:col-span-2">
            <DataExplorer
              :tables="tables"
              :fetch-full-table="fetchFullTableData"
              :run-sql="runSqlQuery"
              @add-pivot-chart="onAiChartSuggestion"
            />
          </div>
          <div>
            <ChatPanel
              :schema-text="exploreSchemaText"
              @apply-chart="onAiChartSuggestion"
              @run-sql="onAiRunSql"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="goToStep(1)" class="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Back</button>
          <button @click="goToStep(3)" class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Continue to build
          </button>
        </div>
      </div>

      <!-- Step 3: Build -->
      <div v-if="currentStep === 3 && tables.length">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Build your dashboard</h2>
          <p class="text-sm text-gray-500 mt-1">Drag charts to position them. Click to configure in the properties panel.</p>
        </div>

        <!-- Data sources & join config -->
        <div class="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data sources</h3>
            <button @click="showJoinConfig = !showJoinConfig" class="text-xs text-blue-600 hover:underline">
              {{ showJoinConfig ? 'Hide' : 'Configure joins' }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-for="t in tables" :key="t.name"
              class="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{{ t.name }} ({{ t.columns.length }} cols)</span>
          </div>

          <!-- Relationship diagram -->
          <div v-if="joins.length > 0" class="mt-4 border-t border-gray-100 pt-4">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Table relationships</h4>
            <svg :viewBox="'0 0 ' + joinSvgW + ' 120'" class="w-full max-w-2xl" style="height:120px">
              <defs>
                <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M0,0 L8,3 L0,6" fill="#3B82F6" />
                </marker>
              </defs>
              <g v-for="(j, ji) in joins" :key="ji">
                <!-- Table 1 box -->
                <rect :x="20" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
                <text :x="90" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#1E40AF" font-weight="600">{{ j.table1 }}</text>
                <text :x="90" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col1 || '?' }}</text>
                <!-- Join type label -->
                <rect :x="165" :y="12 + ji * 28" width="64" height="18" rx="9" fill="#DBEAFE" />
                <text :x="197" :y="25 + ji * 28" text-anchor="middle" font-size="8" fill="#1E40AF" font-weight="600">{{ j.type }}</text>
                <!-- Line connecting tables -->
                <line :x1="160" :y1="21 + ji * 28" :x2="235" :y2="21 + ji * 28" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrowHead)" />
                <!-- Table 2 box -->
                <rect :x="240" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#F0FDF4" stroke="#10B981" stroke-width="1.5" />
                <text :x="310" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#166534" font-weight="600">{{ j.table2 }}</text>
                <text :x="310" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col2 || '?' }}</text>
              </g>
            </svg>
          </div>

          <!-- Join config -->
          <div v-if="showJoinConfig" class="mt-4 border-t border-gray-100 pt-4 space-y-3">
            <div v-for="(j, ji) in joins" :key="ji"
              class="flex items-center gap-2 text-sm flex-wrap">
              <select :value="j.table1" @change="updateJoin(ji, 'table1', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
              </select>
              <span>.</span>
              <select :value="j.col1" @change="updateJoin(ji, 'col1', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option value="">-- column --</option>
                <option v-for="c in getColumns(j.table1)" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
              <select :value="j.type" @change="updateJoin(ji, 'type', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option value="INNER">INNER JOIN</option>
                <option value="LEFT">LEFT JOIN</option>
                <option value="RIGHT">RIGHT JOIN</option>
                <option value="FULL OUTER">FULL JOIN</option>
              </select>
              <select :value="j.table2" @change="updateJoin(ji, 'table2', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
              </select>
              <span>.</span>
              <select :value="j.col2" @change="updateJoin(ji, 'col2', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option value="">-- column --</option>
                <option v-for="c in getColumns(j.table2)" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
              <button @click="removeJoin(ji)" class="text-red-400 hover:text-red-600 text-xs ml-1">&times;</button>
            </div>
            <button @click="addJoin" class="text-xs text-blue-600 hover:underline">+ Add join</button>
          </div>
        </div>

        <!-- Suggested charts -->
        <div v-if="chartSuggestions.length || aiSuggestions.length" class="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Suggested charts</h3>
            <button @click="runAiSuggest" :disabled="aiStatus === 'loading'"
              class="text-xs px-2.5 py-1 rounded font-medium transition-colors"
              :class="aiStatus === 'ready' ? 'bg-purple-600 text-white hover:bg-purple-700' : aiStatus === 'loading' ? 'bg-gray-200 text-gray-400 cursor-wait' : 'border border-purple-200 text-purple-600 hover:bg-purple-50'">
              {{ aiStatus === 'loading' ? 'AI (' + aiProgress + '%)' : aiStatus === 'error' ? 'AI error' : aiSuggestions.length ? 'AI re-suggest' : 'AI suggest' }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="(s, i) in chartSuggestions" :key="'r'+i" @click="applySuggestion(s)"
              class="text-xs border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-left"
              :class="s.chartType === 'line' ? 'border-green-200 hover:border-green-300' : s.chartType === 'pie' ? 'border-purple-200 hover:border-purple-300' : 'border-blue-200 hover:border-blue-200'">
              <span class="block font-medium text-gray-700">{{ s.label }}</span>
              <span class="block text-gray-400 mt-0.5">{{ s.xCol }} → {{ s.agg }} of {{ s.yCol }} ({{ s.chartType }})</span>
            </button>
            <button v-for="(s, i) in aiSuggestions" :key="'a'+i" @click="applySuggestion(s)"
              class="text-xs border rounded-lg px-3 py-2 hover:bg-purple-50 transition-colors text-left border-purple-200">
              <span class="block font-medium text-purple-700 flex items-center gap-1">
                {{ s.label }}
                <span class="text-[9px] bg-purple-100 text-purple-500 rounded px-1">AI</span>
              </span>
              <span class="block text-gray-400 mt-0.5">{{ s.xCol }} → {{ s.agg }} of {{ s.yCol }} ({{ s.chartType }})</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div class="xl:col-span-3">
            <DashboardCanvas
              ref="canvasRef"
              :charts="charts"
              :texts="texts"
              :columns="allColumns"
              :numeric-columns="allNumericCols"
              :view-only="viewOnly"
              @update="onChartUpdate"
              @add-chart="addChart"
              @remove-chart="removeChart"
              @update-text="onTextUpdate"
              @add-text="addTextItem"
              @delete-text="removeTextItem"
              @toggle-view="viewOnly = !viewOnly"
              @auto-layout="autoLayoutCharts"
            />
          </div>
          <div class="hidden xl:block">
            <ChatPanel
              :schema-text="exploreSchemaText"
              @apply-chart="onAiChartSuggestion"
              @run-sql="onAiRunSql"
            />
          </div>
        </div>
      </div>

      <!-- Step 4: Export -->
      <div v-if="currentStep === 4">
        <div class="mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-800">Save and export</h2>
            <p class="text-sm text-gray-500 mt-1">Save your report in your browser or export it.</p>
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">Report name</label>
          <input v-model="dashboardName" type="text"
            class="w-full max-w-sm border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Monthly Sales Report" />
        </div>
        <ExportTools
          :report-config="reportConfig"
          :has-data="charts.length > 0"
          :raw-columns="allColumns"
          :raw-rows="allRows"
          :tables="tables"
          :chart-data-query="fetchAllData"
          :chart-images="capturedImages"
          :dashboard-image="capturedDashboardImage"
          :fetch-full-table="fetchFullTableData"
          :capture-dashboard="captureDashboardScreenshot"
          @load-report="onLoadReport"
        />
      </div>
    </main>

    <ToastContainer />
    <div v-if="tables.length && currentStep < 4" class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-6 py-3">
      <div class="max-w-7xl mx-auto flex justify-end">
        <button @click="goToExport"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {{ currentStep === 1 ? 'Continue to explore' : currentStep === 2 ? 'Continue to build' : 'Continue to export' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import * as duckdb from '@duckdb/duckdb-wasm'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend } from 'chart.js'
import mvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import ehWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import coiWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url'
import mvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import coiWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url'
import coiPthreadWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url'
import CsvUploader from './components/CsvUploader.vue'
import DashboardCanvas from './components/DashboardCanvas.vue'
import ExportTools from './components/ExportTools.vue'
import DataExplorer from './components/DataExplorer.vue'
import ToastContainer from './components/ToastContainer.vue'
import ChatPanel from './components/ChatPanel.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend)

const steps = ['Upload', 'Explore', 'Build', 'Export']
const currentStep = ref(1)

let db = null
let conn = null
const tables = ref([])
const charts = ref([])
const texts = ref([])
const joins = ref([])
const showJoinConfig = ref(false)
const viewOnly = ref(false)
const timers = {}
const capturedImages = ref([])
const capturedDashboardImage = ref(null)
const canvasRef = ref(null)
const showAbout = ref(false)
const duckIconSrc = (import.meta.env.BASE_URL || '/') + 'duck-icon.svg'
const aiSuggestions = ref([])
const aiStatus = ref('idle')
const aiProgress = ref(0)
const loadingSamples = ref(false)
const sampleFiles = 3
const dashboardName = ref('My Report')
let idCounter = 0
const usedTableNames = new Set()

const bgColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

function uid() { return (Date.now() + ++idCounter).toString(36) }

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

async function onAiChartSuggestion(s) {
  const offset = 20 + charts.value.length * 30
  const chart = {
    id: uid(), _type: 'chart',
    title: s.label,
    table: tables.value[0]?.name || '',
    xCol: s.xCol, yCol: s.yCol, agg: s.agg, chartType: s.chartType,
    sortDir: 'DESC', limit: 50, filter: '',
    x: offset % 600, y: offset, width: 420, height: 300,
    queryResult: [], resultColumns: [], chartData: null,
    _loading: false, _error: '',
  }
  charts.value = [...charts.value, chart]
  setTimeout(() => runChartQuery(chart), 100)
  const { useToast: ut } = await import('./lib/toast')
  const { showToast } = ut()
  showToast('Chart "' + s.label + '" added!')
}

async function onAiRunSql(sql) {
  currentStep.value = 2
  // Execute the SQL and show results
  const results = await runSqlQuery(sql)
  const { useToast: ut } = await import('./lib/toast')
  const { showToast } = ut()
  if (results.length) {
    showToast('Query returned ' + results.length + ' rows — see Explore tab')
  } else {
    showToast('Query returned no results', 'warning')
  }
}

const chartSuggestions = computed(() => {
  const cats = allColumns.value.filter(c => !allNumericCols.value.includes(c))
  const nums = allNumericCols.value
  if (!cats.length || !nums.length) return []
  const firstTable = tables.value[0]?.name || ''
  const dateCols = cats.filter(c => c.type.toUpperCase().includes('DATE') || c.name.toLowerCase().includes('date'))
  const suggestions = []
  // Bar: cat + num
  if (cats[0] && nums[0]) suggestions.push({ label: cats[0].name + ' by ' + nums[0].name, xCol: cats[0].name, yCol: nums[0].name, agg: 'SUM', chartType: 'bar', table: firstTable })
  // Line: date + num (only if date column exists)
  if (dateCols.length && nums[0]) suggestions.push({ label: nums[0].name + ' over time', xCol: dateCols[0].name, yCol: nums[0].name, agg: 'SUM', chartType: 'line', table: firstTable })
  // Pie: cat with few values
  if (cats.length > 1) suggestions.push({ label: 'Distribution of ' + cats[1].name, xCol: cats[1].name, yCol: nums[0].name, agg: 'SUM', chartType: 'pie', table: firstTable })
  // Second bar if we have another cat
  if (cats.length > 2 && nums.length > 1) suggestions.push({ label: cats[2].name + ' by ' + nums[1].name, xCol: cats[2].name, yCol: nums[1].name, agg: 'AVG', chartType: 'bar', table: firstTable })
  // Line with AVG if we have date
  if (dateCols.length && nums.length > 1) suggestions.push({ label: 'Avg ' + nums[1].name + ' over time', xCol: dateCols[0].name, yCol: nums[1].name, agg: 'AVG', chartType: 'line', table: firstTable })
  return suggestions.slice(0, 6)
})

function getColumns(tableName) {
  const t = tables.value.find(x => x.name === tableName)
  return t?.columns || []
}

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
  })),
  texts: texts.value.map(t => ({ id: t.id, text: t.text, x: t.x, y: t.y, fontSize: t.fontSize, bold: t.bold, color: t.color })),
}))

function cleanValue(v) {
  if (v == null) return null
  if (typeof v === 'bigint') return Number(v)
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (t.startsWith('"') && t.endsWith('"')) return cleanValue(t.slice(1, -1))
    if (t !== '' && !isNaN(Number(t))) return Number(t)
    if (t === '' || t === '-' || t === '—') return null
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

function canNavigateTo(step) {
  if (step === 1) return true
  if (step === 2) return tables.value.length > 0
  if (step === 3) return tables.value.length > 0
  if (step === 4) return charts.value.length > 0
  return false
}

async function captureAllContent() {
  capturedImages.value = canvasRef.value?.captureAllImages ? await canvasRef.value.captureAllImages() : []
  capturedDashboardImage.value = await captureDashboardScreenshot()
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

// DuckDB

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

    // Count rows
    const countRes = await conn.query('SELECT COUNT(*) AS cnt FROM ' + tableName)
    const rowCount = Number(countRes.toArray()[0].cnt)

    tables.value = [...tables.value, { name: tableName, fileName: file.name, columns: cols, rows, rowCount }]
  } catch (err) {
    console.error(err)
    const { useToast: ut } = await import('./lib/toast')
    ut().showToast('Could not read the file ' + file.name, 'error')
  }
}

function removeTable(name) {
  tables.value = tables.value.filter(t => t.name !== name)
  joins.value = joins.value.filter(j => j.table1 !== name && j.table2 !== name)
}

// Joins

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
  // If chart has a specific table not in join, append it
  if (chartTable && !from.includes(chartTable)) {
    from = '"' + chartTable + '", ' + from
  }
  return from
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

import html2canvas from 'html2canvas'

async function captureDashboardScreenshot() {
  const scrollEl = document.querySelector('.canvas-scroll')
  if (!scrollEl) return null
  const inner = scrollEl.querySelector('div.relative')
  if (!inner) return null
  try {
    const origOverflow = scrollEl.style.overflow
    scrollEl.style.overflow = 'visible'
    const canvas = await html2canvas(inner, { useCORS: true, scale: 2, backgroundColor: '#ffffff' })
    scrollEl.style.overflow = origOverflow
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

// Text annotations

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

// Charts

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

async function runAiSuggest() {
  if (!tables.value.length) return
  aiStatus.value = 'loading'
  aiSuggestions.value = []
  try {
    const { useModel } = await import('./lib/model')
    const m = useModel()
    if (m.modelStatus.value !== 'ready') await m.ensureLoaded().catch(() => {})

    let schemaText = tables.value.map(t => {
      const cols = t.columns.map(c => c.name + ' (' + c.type + ')').join(', ')
      return 'Table: ' + t.name + '\nColumns: ' + cols
    }).join('\n\n')

    if (joins.value.length) {
      schemaText += '\n\nJoins:\n' + joins.value.map(j =>
        j.table1 + '.' + j.col1 + ' = ' + j.table2 + '.' + j.col2 + ' (' + j.type + ')'
      ).join('\n')
    }

    aiProgress.value = 100
    const results = await m.suggestCharts(schemaText)

    aiSuggestions.value = results.map(r => ({
      ...r,
      table: tables.value[0]?.name || '',
    }))

    aiStatus.value = aiSuggestions.value.length ? 'ready' : 'done'
  } catch {
    aiStatus.value = 'error'
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

async function captureAndExport() {
  if (!canvasRef.value) return
  capturedImages.value = await canvasRef.value.captureAllImages()
  currentStep.value = 4
}

async function runSqlQuery(sql) {
  if (!conn) return []
  try {
    const res = await conn.query(sql)
    return toPlain(res.toArray())
  } catch { return [] }
}

function onLoadReport(config) {
  dashboardName.value = config.name || 'Imported Report'
  charts.value = (config.charts || []).map(c => ({ ...c, _type: 'chart', chartData: null, _loading: false, _error: '' }))
  texts.value = (config.texts || []).map(t => ({ ...t, _type: 'text' }))
  if (config.joins) joins.value = config.joins
  capturedImages.value = []
  viewOnly.value = true
  currentStep.value = 3
  setTimeout(() => charts.value.forEach(runChartQuery), 100)
}
</script>

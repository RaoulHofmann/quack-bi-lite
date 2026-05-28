<template>
  <div class="bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-3">
      <div class="max-w-[1600px] mx-auto flex items-center justify-between">
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
          <button @click="showTutorial = true" class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Tutorial">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
          <button @click="showAbout = true" class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="About">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path stroke-linecap="round" d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
        </nav>
      </div>
    </header>

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
          <p>A ducky little BI tool that lives entirely in your browser. Upload CSVs, explore data, build dashboards, and export to Excel/PDF — all without sending data anywhere.</p>
          <p class="text-xs text-gray-400 pt-2">
            Built with Vue 3 &bull; DuckDB-WASM &bull; Chart.js<br>
            <a href="https://github.com/RaoulHofmann/quack-bi-lite" class="text-blue-600 hover:underline">GitHub</a>
          </p>
        </div>
        <button @click="showAbout = false" class="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Close</button>
      </div>
    </div>

     <main class="mx-auto p-6" :style="currentStep === 3 ? 'max-width:100%' : 'max-width:1600px'">
      <!-- Step 1: Upload -->
      <div v-if="currentStep === 1">
        <!-- App overview -->
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div class="flex gap-3">
            <svg class="w-6 h-6 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <div>
              <h3 class="text-sm font-semibold text-blue-800">What is Quack BI Lite?</h3>
              <p class="text-xs text-blue-600 mt-1 leading-relaxed">
                A browser-based BI tool that lets you upload data, explore it with SQL, build interactive dashboards, and export reports — all locally, nothing leaves your machine.
                Follow the <strong>4 steps</strong> above to go from raw data to a polished report.
              </p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <div v-for="(desc, i) in stepDescriptions" :key="i"
              class="flex items-center gap-1.5 text-xs bg-white/70 border border-blue-100 rounded-full px-3 py-1 text-blue-700">
              <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">{{ i + 1 }}</span>
              <span>{{ desc }}</span>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Upload your data</h2>
          <p class="text-sm text-gray-500 mt-1">Upload CSV, Excel, or JSON files. Each file becomes a table you can query and join.</p>
        </div>
        <DataUploader @uploaded="handleFileUpload" />
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
<!--          <div class="flex gap-3 mt-4">-->
<!--            <button @click="goToStep(2)" :disabled="!tables.length"-->
<!--              class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">-->
<!--              Continue to explore-->
<!--            </button>-->
<!--          </div>-->
        </div>
      </div>

      <!-- Step 2: Explore -->
      <div v-if="currentStep === 2 && tables.length">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Explore your data</h2>
          <p class="text-sm text-gray-500 mt-1">Browse tables, profile columns, and run ad-hoc SQL queries before building charts.</p>
        </div>
        <div>
          <DataExplorer
            :tables="tables"
            :fetch-full-table="fetchFullTableData"
            :run-sql="runSqlQuery"
            :add-query-result="addQueryResult"
          />
        </div>
<!--        <div class="flex gap-3 mt-6">-->
<!--          <button @click="goToStep(1)" class="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Back</button>-->
<!--          <button @click="goToStep(3)" class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">-->
<!--            Continue to build-->
<!--          </button>-->
<!--        </div>-->
      </div>

      <!-- Step 3: Build -->
      <div v-if="currentStep === 3 && tables.length">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-800">Build your dashboard</h2>
          <p class="text-sm text-gray-500 mt-1">Click <strong>+ Chart</strong> on the canvas toolbar to add charts. Drag to position them. Click a chart to configure in the properties panel.</p>
        </div>

        <div class="flex gap-4" style="height:calc(100vh - 10rem)">
          <div class="w-80 shrink-0 overflow-y-auto space-y-4 pr-1">
            <div class="bg-white border border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Data sources</h3>
                <button @click="showJoinModal = true" class="text-xs text-blue-600 hover:underline">
                  Configure joins
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <span v-for="t in tables" :key="t.name"
                  class="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{{ t.name }} ({{ t.columns.length }} cols)</span>
              </div>
              <div v-if="joins.length > 0" class="mt-4 border-t border-gray-100 pt-4">
                <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Table relationships</h4>
                <svg :viewBox="'0 0 ' + joinSvgW + ' 120'" class="w-full" style="height:120px">
                  <defs>
                    <marker id="arrowHead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6" fill="#3B82F6" />
                    </marker>
                  </defs>
                  <g v-for="(j, ji) in joins" :key="ji">
                    <rect :x="20" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" />
                    <text :x="90" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#1E40AF" font-weight="600">{{ j.table1 }}</text>
                    <text :x="90" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col1 || '?' }}</text>
                    <rect :x="165" :y="12 + ji * 28" width="64" height="18" rx="9" fill="#DBEAFE" />
                    <text :x="197" :y="25 + ji * 28" text-anchor="middle" font-size="8" fill="#1E40AF" font-weight="600">{{ j.type }}</text>
                    <line :x1="160" :y1="21 + ji * 28" :x2="235" :y2="21 + ji * 28" stroke="#3B82F6" stroke-width="1.5" marker-end="url(#arrowHead)" />
                    <rect :x="240" :y="10 + ji * 28" width="140" height="22" rx="4" fill="#F0FDF4" stroke="#10B981" stroke-width="1.5" />
                    <text :x="310" :y="25 + ji * 28" text-anchor="middle" font-size="10" fill="#166534" font-weight="600">{{ j.table2 }}</text>
                    <text :x="310" :y="37 + ji * 28" text-anchor="middle" font-size="8" fill="#64748B">{{ j.col2 || '?' }}</text>
                  </g>
                </svg>
              </div>
            </div>

            <div v-if="chartSuggestions.length" class="bg-white border border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Suggested charts</h3>
              </div>
              <div class="flex flex-wrap gap-2">
                <button v-for="(s, i) in chartSuggestions" :key="'r'+i" @click="applySuggestion(s)"
                  class="text-xs border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  :class="s.chartType === 'line' ? 'border-green-200 hover:border-green-300' : s.chartType === 'pie' ? 'border-purple-200 hover:border-purple-300' : 'border-blue-200 hover:border-blue-200'">
                  <span class="block font-medium text-gray-700">{{ s.label }}</span>
                  <span class="block text-gray-400 mt-0.5">{{ s.xCol }} &rarr; {{ s.agg }} of {{ s.yCol }} ({{ s.chartType }})</span>
                </button>
              </div>
            </div>

            <div v-for="(pivot, pi) in sharedPivots" :key="pivot.id" class="bg-white border border-gray-200 rounded-xl p-4 relative">
              <button @click="removePivot(pi)" class="absolute top-2 right-2 text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
              <div class="mb-2 text-xs text-gray-400 italic">Pivot {{ pi + 1 }}</div>
              <div class="flex items-center justify-end gap-2 mb-2">
                <button @click="applySuggestion({ label: pivot.rowCol + ' pivot', xCol: pivot.rowCol, yCol: pivot.valCol, agg: pivot.agg, chartType: 'bar', _fromPivot: true, _pivotHeaders: pivot.headers, _pivotRef: pi })"
                  class="text-xs bg-purple-600 text-white px-2.5 py-1 rounded hover:bg-purple-700 transition-colors">
                  Add chart from pivot
                </button>
              </div>
              <div class="overflow-x-auto max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table class="w-full text-xs border-collapse">
                  <thead class="sticky top-0 z-10">
                    <tr>
                      <th class="px-2 py-1.5 text-left font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ pivot.rowCol || 'Row' }}</th>
                      <th v-for="h in pivot.headers" :key="h" class="px-2 py-1.5 text-right font-semibold text-gray-500 uppercase border-b bg-gray-100 whitespace-nowrap">{{ h }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in pivot.result" :key="ri" class="border-b border-gray-50 even:bg-gray-50/50 hover:bg-blue-50/30">
                      <td class="px-2 py-1 font-medium text-gray-700 whitespace-nowrap">{{ row._row }}</td>
                      <td v-for="h in pivot.headers" :key="h" class="px-2 py-1 text-right text-gray-600 whitespace-nowrap">{{ row[h] != null ? (typeof row[h] === 'number' ? row[h].toLocaleString() : String(row[h]).slice(0, 50)) : '\u2014' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button @click="showPivotModal = true"
              class="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition-colors">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <div>
                  <p class="text-sm font-semibold text-gray-700">Create pivot table</p>
                  <p class="text-xs text-gray-400 mt-0.5">Cross-tabulate rows, columns, and values</p>
                </div>
              </div>
            </button>
          </div>

          <div class="flex-1 min-h-0">
            <GridCanvas
            ref="canvasRef"
            :tables="tables"
            :columns="allColumns"
            :numeric-columns="allNumericCols"
            :view-only="viewOnly"
            @toggle-view="viewOnly = !viewOnly"
          />
          </div>
        </div>

      <!-- Join config modal -->
      <div v-if="showJoinModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="showJoinModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Configure joins</h3>
            <button @click="showJoinModal = false" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <p class="text-sm text-gray-500 mb-4">Define relationships between your tables to enable cross-table queries and charts.</p>
          <div v-if="!joins.length" class="text-sm text-gray-400 text-center py-8">No joins yet. Click below to add one.</div>
          <div class="space-y-3">
            <div v-for="(j, ji) in joins" :key="ji"
              class="flex items-center gap-2 text-sm flex-wrap bg-gray-50 rounded-lg p-3">
              <select :value="j.table1" @change="updateJoin(ji, 'table1', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
              </select>
              <span class="text-gray-400">.</span>
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
              <span class="text-gray-400">.</span>
              <select :value="j.col2" @change="updateJoin(ji, 'col2', $event.target.value)"
                class="border border-gray-200 rounded p-1 text-xs bg-white">
                <option value="">-- column --</option>
                <option v-for="c in getColumns(j.table2)" :key="c.name" :value="c.name">{{ c.name }}</option>
              </select>
              <button @click="removeJoin(ji)" class="text-red-400 hover:text-red-600 text-xs ml-auto shrink-0">&times;</button>
            </div>
          </div>
          <button @click="addJoin" class="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add join
          </button>
          <div class="mt-6 flex justify-end">
            <button @click="showJoinModal = false" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Done</button>
          </div>
        </div>
      </div>

      <!-- Pivot table modal -->
      <div v-if="showPivotModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="showPivotModal = false">
        <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between p-6 pb-0">
            <h3 class="text-lg font-semibold text-gray-800">Create pivot table</h3>
            <button @click="showPivotModal = false" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
            <PivotTable
              v-if="tables[0]"
              :selected-table="tables[0].name"
              :table-columns="tables[0]?.columns || []"
              :numeric-cols="allNumericCols"
              :run-sql="runSqlQuery"
              @add-pivot-chart="applySuggestion"
              @pivot-generated="addPivot"
            />
        </div>
      </div>
      </div>

      <!-- Step 4: Export -->
      <div v-if="currentStep === 4">
        <div class="mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-800">Save and export</h2>
            <p class="text-sm text-gray-500 mt-1">Save your report, or export to Excel, PDF or JSON.</p>
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
          :chart-data-query="() => fetchAllData(joins.value, tables.value)"
          :chart-images="capturedImages"
          :dashboard-image="capturedDashboardImage"
          :fetch-full-table="fetchFullTableData"
          :capture-dashboard="captureDashboardScreenshot"
          @load-report="onLoadReport"
        />
      </div>
    </main>

    <TutorialModal v-if="showTutorial" @close="showTutorial = false" />
    <ToastContainer />
    <div v-if="tables.length && currentStep < 4" class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-6 py-3">
      <div class="max-w-[1600px] mx-auto flex justify-end">
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend } from 'chart.js'
import html2canvas from 'html2canvas'

import { useDuckDb } from './composables/useDuckDb'
import { useDataSources } from './composables/useDataSources'
import { useReport } from './composables/useReport'
import DataUploader from './components/DataUploader.vue'
import GridCanvas from './components/GridCanvas.vue'
import ExportTools from './components/ExportTools.vue'
import DataExplorer from './components/DataExplorer.vue'
import PivotTable from './components/PivotTable.vue'
import ToastContainer from './components/ToastContainer.vue'
import TutorialModal from './components/TutorialModal.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend)

const duckDb = useDuckDb()
const { registerCSV, registerExcel, registerJSON, runSqlQuery, fetchFullTableData, buildFromClause, fetchAllData, createTableFromQuery } = duckDb

const dataSources = useDataSources({ registerCSV, registerExcel, registerJSON })
const { tables, loadingSamples, allColumns, allNumericCols, allRows, handleFileUpload, loadSampleData, removeTable: dsRemoveTable, getColumns, registerTableFromQuery, uid } = dataSources

const report = useReport({ runSqlQuery, buildFromClause, fetchFullTableData, tables, allColumns, allNumericCols, getColumns, uid })
const {
  charts, joins, sharedPivots, showJoinConfig, viewOnly,
  dashboardName, capturedImages, capturedDashboardImage,
  chartSuggestions, reportConfig,
  applySuggestion,
  runSqlAndNavigate: reportRunSqlAndNavigate,
  addJoin, updateJoin, removeJoin,
  addPivot, removePivot,
  onLoadReport: reportOnLoadReport,
} = report

const sampleFiles = 3
const currentStep = ref(1)
const steps = ['Upload', 'Explore', 'Build', 'Export']
const stepDescriptions = ['Import your data', 'Query & explore', 'Build dashboards', 'Export reports']
const showAbout = ref(false)
const showTutorial = ref(false)
const canvasRef = ref(null)
const duckIconSrc = (import.meta.env.BASE_URL || '/') + 'duck-icon.svg'
const showJoinModal = ref(false)
const showPivotModal = ref(false)

const joinSvgW = computed(() => Math.max(400, joins.value.length * 28 + 60))

async function addQueryResult(tableName, sql) {
  const meta = await createTableFromQuery(tableName, sql)
  registerTableFromQuery(tableName, meta)
}

function removeTable(name) {
  dsRemoveTable(name, (removedName) => {
    joins.value = joins.value.filter(j => j.table1 !== removedName && j.table2 !== removedName)
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

async function captureDashboardScreenshot() {
  const gridEl = document.querySelector('.vue-grid-layout')
  if (!gridEl) return null

  // Switch grid items from CSS transforms (translate3d) to top/left
  // positioning — html2canvas doesn't reliably capture items positioned
  // with transforms in vue-grid-layout-v3
  const items = [...gridEl.querySelectorAll(':scope > .vue-grid-item')]
  if (!items.length) return null
  const itemStates = items.map(item => {
    const s = { el: item, transform: item.style.transform, left: item.style.left, top: item.style.top, transition: item.style.transition }
    const m = item.style.transform?.match(/translate3d\(\s*([\d.-]+)px\s*,\s*([\d.-]+)px/)
    if (m) {
      item.style.left = m[1] + 'px'
      item.style.top = m[2] + 'px'
      item.style.transform = 'none'
    }
    item.style.transition = 'none'
    return s
  })

  const origHeight = gridEl.style.height
  const origTransition = gridEl.style.transition
  gridEl.style.transition = 'none'
  let maxBottom = 0
  for (const item of items) {
    const b = item.offsetTop + item.offsetHeight
    if (b > maxBottom) maxBottom = b
  }
  if (maxBottom > 0) gridEl.style.height = maxBottom + 'px'

  try {
    const canvas = await html2canvas(gridEl, { useCORS: true, scale: 3, backgroundColor: '#ffffff' })
    return cropToContent(canvas).toDataURL('image/png')
  } catch {
    return null
  } finally {
    gridEl.style.transition = origTransition
    gridEl.style.height = origHeight
    for (const s of itemStates) {
      s.el.style.transform = s.transform
      s.el.style.left = s.left
      s.el.style.top = s.top
      s.el.style.transition = s.transition
    }
  }
}

function cropToContent(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data

  function isWhite(x, y) {
    const i = (y * width + x) * 4
    return data[i] >= 248 && data[i + 1] >= 248 && data[i + 2] >= 248
  }

  let top = 0, bottom = height - 1, left = 0, right = width - 1
  for (let y = 0; y < height; y++) {
    let allWhite = true
    for (let x = 0; x < width; x++) { if (!isWhite(x, y)) { allWhite = false; break } }
    if (!allWhite) { top = y; break }
  }
  for (let y = height - 1; y >= 0; y--) {
    let allWhite = true
    for (let x = 0; x < width; x++) { if (!isWhite(x, y)) { allWhite = false; break } }
    if (!allWhite) { bottom = y; break }
  }
  for (let x = 0; x < width; x++) {
    let allWhite = true
    for (let y = top; y <= bottom; y++) { if (!isWhite(x, y)) { allWhite = false; break } }
    if (!allWhite) { left = x; break }
  }
  for (let x = width - 1; x >= 0; x--) {
    let allWhite = true
    for (let y = top; y <= bottom; y++) { if (!isWhite(x, y)) { allWhite = false; break } }
    if (!allWhite) { right = x; break }
  }

  const pad = 40
  const cropW = Math.min(right - left + 1 + pad * 2, width)
  const cropH = Math.min(bottom - top + 1 + pad * 2, height)
  const cropLeft = Math.max(0, left - pad)
  const cropTop = Math.max(0, top - pad)
  const out = document.createElement('canvas')
  out.width = cropW
  out.height = cropH
  out.getContext('2d').drawImage(canvas, cropLeft, cropTop, cropW, cropH, 0, 0, cropW, cropH)
  return out
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

function runSqlAndNavigate(sql) {
  reportRunSqlAndNavigate(sql, (step) => { currentStep.value = step })
}

function onLoadReport(config) {
  const runQueries = reportOnLoadReport(config)
  currentStep.value = 3
  if (typeof runQueries === 'function') {
    setTimeout(runQueries, 100)
  }
}

</script>

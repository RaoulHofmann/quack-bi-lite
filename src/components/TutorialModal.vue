<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[85vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <svg class="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h2 class="text-lg font-bold text-gray-800">Tutorial &mdash; How it works</h2>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div class="space-y-5">
        <div v-for="(step, i) in steps" :key="i"
          class="border rounded-xl p-4"
          :class="borderColors[i]">
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
              :class="badgeColors[i]">
              {{ i + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-800">{{ step.title }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ step.summary }}</p>

              <ul class="mt-3 space-y-2">
                <li v-for="(item, j) in step.items" :key="j" class="flex items-start gap-2 text-sm text-gray-600">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" :class="item.iconColor || 'text-blue-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                  </svg>
                  <span v-html="item.text"></span>
                </li>
              </ul>

              <div v-if="step.example" class="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Example</p>
                <p class="text-sm text-gray-700" v-html="step.example"></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button @click="$emit('close')"
        class="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">
        Got it
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])

const borderColors = ['border-blue-200', 'border-green-200', 'border-purple-200', 'border-orange-200']
const badgeColors = ['bg-blue-600 text-white', 'bg-green-600 text-white', 'bg-purple-600 text-white', 'bg-orange-500 text-white']

const steps = [
  {
    title: 'Upload',
    summary: 'Bring your data into Quack BI by uploading files or trying sample data.',
    items: [
      { icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', iconColor: 'text-blue-500',
        text: 'Drop <strong>CSV, Excel (.xlsx/.xls), or JSON</strong> files onto the upload area, or click to browse' },
      { icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', iconColor: 'text-purple-500',
        text: 'Click <strong>Load sample data</strong> to instantly explore the app with pre-made CSV files' },
      { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', iconColor: 'text-green-500',
        text: 'Each uploaded file becomes a <strong>database table</strong> you can query with SQL, join with other tables, and visualize' },
      { icon: 'M6 18L18 6M6 6l12 12', iconColor: 'text-red-400',
        text: 'Remove tables you don\'t need with the <strong>Remove</strong> button' },
    ],
    example: 'Upload a <code>sales.csv</code> file &mdash; it instantly becomes a table named <strong>sales</strong> with all columns and rows ready for SQL queries.',
  },
  {
    title: 'Explore',
    summary: 'Browse your data, inspect columns, and run SQL queries to transform and prepare your data.',
    items: [
      { icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z', iconColor: 'text-blue-500',
        text: 'Browse your tables with <strong>sortable columns</strong> and <strong>paginated</strong> row views' },
      { icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75', iconColor: 'text-green-500',
        text: 'Inspect column <strong>profiles</strong> &mdash; data type, min/max values, unique count, null count, and sample values' },
      { icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z', iconColor: 'text-purple-500',
        text: 'Run <strong>custom SQL queries</strong> against your tables with <code>SELECT</code>, <code>WHERE</code>, <code>GROUP BY</code>, <code>JOIN</code>, <code>HAVING</code>, and more' },
      { icon: 'M12 9v6m3-3H9', iconColor: 'text-orange-500',
        text: '<strong>Save query results as new tables</strong> that appear in the Build step for charting &mdash; perfect for aggregations and filtered datasets' },
    ],
    example: 'Run <code>SELECT product, SUM(amount) as total FROM sales GROUP BY product ORDER BY total DESC</code> then click <strong>Add as table</strong> to create a new aggregated table for visualization.',
  },
  {
    title: 'Build',
    summary: 'Create visualizations and arrange them into a dashboard using drag-and-drop.',
    items: [
      { icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z', iconColor: 'text-blue-500',
        text: 'Add <strong>bar, line, pie, doughnut, polar area, and radar</strong> charts from your tables or saved query results' },
      { icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75', iconColor: 'text-green-500',
        text: 'Configure <strong>X axis, Y axis, aggregation</strong> (SUM, AVG, COUNT, MIN, MAX), and <strong>filters</strong> for each chart' },
      { icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', iconColor: 'text-purple-500',
        text: '<strong>Drag and drop</strong> charts to arrange your dashboard layout freely' },
      { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', iconColor: 'text-orange-500',
        text: 'Create <strong>pivot tables</strong> to cross-tabulate data, then convert them into charts with one click' },
      { icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244', iconColor: 'text-teal-500',
        text: 'Configure <strong>table joins</strong> to combine data from multiple tables for cross-table charts' },
      { icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z', iconColor: 'text-pink-500',
        text: 'Use <strong>suggested charts</strong> that automatically recommend visualizations based on your data columns' },
    ],
    example: 'Select the <strong>sales</strong> table, choose <strong>bar chart</strong>, set X = <code>product</code> and Y = <code>SUM(amount)</code>, then drag the chart to the top-left of your dashboard canvas.',
  },
  {
    title: 'Export',
    summary: 'Save your work locally or export to shareable formats.',
    items: [
      { icon: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z', iconColor: 'text-blue-500',
        text: '<strong>Save to browser</strong> &mdash; your dashboard layout and charts are stored locally for next time' },
      { icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3', iconColor: 'text-green-500',
        text: '<strong>Export to Excel</strong> &mdash; multi-sheet workbook with raw data and chart images' },
      { icon: 'M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75', iconColor: 'text-purple-500',
        text: '<strong>Export as JSON</strong> &mdash; a shareable dashboard file that can be loaded back into Quack BI' },
      { icon: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0a41.862 41.862 0 015.376 5.68m7.104-5.68c.24.03.48.062.72.096m-.72-.096a41.876 41.876 0 00-3.072 5.458m0 0A73.416 73.416 0 0112 21a73.416 73.416 0 01-5.352-1.887m7.104 0a54.433 54.433 0 00-4.032 0m7.104 0a41.876 41.876 0 01-3.072 5.458M7.2 13.829a41.76 41.76 0 013.744-6.76 43.238 43.238 0 014.112 6.76m-7.856 0a74.52 74.52 0 0110.56 0m0 0a41.876 41.876 0 013.072 5.458M12 3l.008.008', iconColor: 'text-red-500',
        text: '<strong>Export as PDF</strong> &mdash; a printable report document with your dashboard layout' },
      { icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z', iconColor: 'text-cyan-500',
        text: 'Download <strong>individual chart images</strong> as PNG or <strong>all at once</strong> as a ZIP archive' },
      { icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', iconColor: 'text-gray-500',
        text: '<strong>Load</strong> previously saved reports from browser storage' },
    ],
    example: 'Click <strong>Save to browser</strong> to store your dashboard, then later click <strong>Load report</strong> to pick up where you left off. Use <strong>Export to Excel</strong> for a multi-sheet workbook with charts.',
  },
]
</script>

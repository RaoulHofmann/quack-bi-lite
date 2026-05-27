<template>
  <div>
    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-8">
      <div class="flex items-center gap-3 mb-5">
        <img :src="duckIconSrc" class="w-10 h-10" alt="Quack BI" />
        <div>
          <h2 class="text-xl font-bold text-gray-800">Quack BI Lite</h2>
          <p class="text-sm text-gray-500">A friendly little data helper that lives right in your browser. No sign-ups, no servers, no data leaving your computer &mdash; just you and your numbers.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="flex items-start gap-3 bg-blue-50 rounded-lg p-4">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-700">Upload and explore</p>
            <p class="text-xs text-gray-500 mt-1">Drop in your CSV files and start exploring right away. Browse your data, run searches, and combine tables &mdash; no database setup required.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 bg-green-50 rounded-lg p-4">
          <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-700">Visualize and build</p>
            <p class="text-xs text-gray-500 mt-1">Turn your data into bar charts, line graphs, pie charts, and more. Drag everything into place and build a dashboard that tells your story.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
          <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-700">Export and share</p>
            <p class="text-xs text-gray-500 mt-1">Download your dashboard as an image or PDF, export your data to Excel, or save your report in the browser to come back to later.</p>
          </div>
        </div>
      </div>
      <p class="text-xs text-gray-400 mt-4 text-center">Your data never leaves your computer. Everything runs right here in this tab.</p>
    </div>

    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800">Upload your data</h2>
      <p class="text-sm text-gray-500 mt-1">You can upload multiple CSV files. Each file becomes a table you can query and join.</p>
    </div>

    <CsvUploader @uploaded="handleFileUpload" />

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
      <div class="flex gap-3 mt-4">
        <button @click="goToStep(2)" :disabled="!tables.length"
          class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Continue to build
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDashboard } from '../../lib/useDashboard'
import CsvUploader from '../CsvUploader.vue'

const {
  tables, loadingSamples, goToStep,
  handleFileUpload, removeTable, loadSampleData,
} = useDashboard()

const sampleFiles = 3
const duckIconSrc = (import.meta.env.BASE_URL || '/') + 'duck-icon.svg'
</script>

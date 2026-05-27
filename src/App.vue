<template>
  <div class="min-h-screen bg-gray-50">
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
          <button @click="showHandsontableDemo = !showHandsontableDemo" class="ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors" :class="showHandsontableDemo ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'" title="Handsontable Demo">HT Demo</button>
          <button @click="showAbout = true" class="ml-2 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="About">
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
          <p>A ducky little BI tool that lives entirely in your browser. Upload CSVs, explore with SQL, build dashboards, and export to Excel/PDF — all without sending data anywhere.</p>
          <p class="text-xs text-gray-400 pt-2">
            Built with Vue 3 &bull; DuckDB-WASM &bull; Chart.js<br>
            <a href="https://github.com/RaoulHofmann/quack-bi-lite" class="text-blue-600 hover:underline">GitHub</a>
          </p>
        </div>
        <button @click="showAbout = false" class="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium transition-colors">Close</button>
      </div>
    </div>

    <main class="max-w-[1600px] mx-auto p-6">
      <component :is="stepComponent" @close="showHandsontableDemo = false" />
    </main>

    <ToastContainer />
    <div v-if="!showHandsontableDemo && tables.length && currentStep < 4" class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-6 py-3">
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
import { computed } from 'vue'
import { useDashboard } from './lib/useDashboard'
import { ref } from 'vue'
import ToastContainer from './components/ToastContainer.vue'
import Upload from './components/steps/Upload.vue'
import Explore from './components/steps/Explore.vue'
import Build from './components/steps/Build.vue'
import Export from './components/steps/Export.vue'
import HandsontableDemo from './components/HandsontableDemo.vue'

const {
  currentStep, tables, showAbout,
  goToStep, goToExport,
  stepButtonClass, stepBadgeClass,
} = useDashboard()

const showHandsontableDemo = ref(false)

const steps = ['Upload', 'Explore', 'Build', 'Export']
const duckIconSrc = (import.meta.env.BASE_URL || '/') + 'duck-icon.svg'

const stepComponent = computed(() => {
  if (showHandsontableDemo.value) return HandsontableDemo
  if (currentStep.value === 1) return Upload
  if (currentStep.value === 2 && tables.value.length) return Explore
  if (currentStep.value === 3 && tables.value.length) return Build
  if (currentStep.value === 4) return Export
  return null
})

</script>

<template>
  <div class="bg-white overflow-hidden flex flex-col" :class="embedded ? 'flex-1 min-h-0 border-0 rounded-none' : 'border border-gray-200 rounded-xl'" :style="embedded ? {} : { height: '500px' }">
    <div class="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Chat with your data</h3>
      <div class="flex items-center gap-2">
        <span v-if="modelStage === 'downloading'" class="text-xs text-purple-500">Downloading ({{ modelProgress }}%)…</span>
        <span v-else-if="modelStage === 'optimizing'" class="text-xs text-purple-500">Optimizing…</span>
        <span v-else-if="modelStage === 'ready'" class="text-xs text-green-500">Ready</span>
        <span v-else-if="modelStage === 'error'" class="text-xs text-red-500 truncate max-w-[120px]" :title="modelError">Error</span>
      </div>
    </div>

    <div class="relative flex-1 flex flex-col min-h-0">
      <!-- Status overlay -->
      <div v-if="modelStage !== 'ready'" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mx-4 max-w-xs w-full text-center">
          <!-- Consent: approve button -->
          <template v-if="modelStage === 'consent'">
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h4 class="text-sm font-semibold text-gray-800 mb-2">AI model required</h4>
            <p class="text-xs text-gray-500 mb-4 leading-relaxed">
              Quack BI uses an AI model (~250MB) to answer questions about your data. The model runs entirely in your browser — your data stays local.
            </p>
            <button @click="approveModel"
              class="w-full bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 transition-colors">
              Approve &amp; download
            </button>
          </template>

          <!-- Checking local files -->
          <template v-else-if="modelStage === 'checking'">
            <svg class="animate-spin w-8 h-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-sm text-gray-500">Checking for local model files…</p>
          </template>

          <!-- Downloading -->
          <template v-else-if="modelStage === 'downloading'">
            <svg class="animate-spin w-8 h-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-sm font-medium text-gray-700 mb-2">Downloading model files…</p>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" :style="{ width: modelProgress + '%' }"></div>
            </div>
            <p class="text-xs text-gray-400">{{ modelProgress }}%</p>
          </template>

          <!-- Optimizing session -->
          <template v-else-if="modelStage === 'optimizing'">
            <svg class="animate-spin w-8 h-8 text-purple-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p class="text-sm text-gray-500">Loading model into memory…</p>
            <p class="text-xs text-gray-400 mt-1">This may take a moment</p>
          </template>

          <!-- Error -->
          <template v-else-if="modelStage === 'error'">
            <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h4 class="text-sm font-semibold text-red-800 mb-2">Model failed to load</h4>
            <p class="text-xs text-red-600 mb-4 break-words max-h-20 overflow-y-auto">{{ modelError }}</p>
            <button @click="approveModel"
              class="w-full bg-purple-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-purple-700 transition-colors">
              Retry
            </button>
          </template>
        </div>
      </div>

      <div ref="messagesRef" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm" :class="{ 'opacity-30 pointer-events-none': modelStage !== 'ready' }">
        <div v-if="!messages.length" class="text-center text-gray-400 mt-8">
          <p class="text-base mb-1">Ask about your data</p>
          <p class="text-xs">e.g. "What are the total sales by region?" or "Suggest a chart for sales over time"</p>
        </div>
        <div v-for="(msg, i) in messages" :key="i">
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="bg-blue-600 text-white rounded-xl rounded-br-sm px-3 py-2 max-w-[80%]">{{ msg.text }}</div>
          </div>
          <div v-else class="flex justify-start">
            <div class="bg-gray-100 text-gray-700 rounded-xl rounded-bl-sm px-3 py-2 max-w-[85%]">
              <div class="whitespace-pre-wrap">{{ msg.text }}</div>
              <div v-if="msg.charts && msg.charts.length" class="mt-2 space-y-1 border-t border-gray-200 pt-2">
                <p class="text-xs font-medium text-gray-500">Suggested charts:</p>
                <button v-for="(c, ci) in msg.charts" :key="ci" @click="$emit('apply-chart', c)"
                  class="w-full text-left text-xs border border-purple-200 rounded-lg px-2.5 py-1.5 hover:bg-purple-50 transition-colors">
                  <span class="block font-medium text-purple-700">{{ c.label }}</span>
                  <span class="text-gray-400">{{ c.xCol }} → {{ c.agg }} of {{ c.yCol }} ({{ c.chartType }})</span>
                </button>
              </div>
              <div v-if="msg.sql" class="mt-2 border-t border-gray-200 pt-2">
                <p class="text-xs font-medium text-gray-500 mb-1">SQL query:</p>
                <pre class="text-xs bg-gray-50 rounded p-2 overflow-x-auto font-mono">{{ msg.sql }}</pre>
                <button @click="$emit('run-sql', msg.sql)" class="mt-1 text-xs text-blue-600 hover:underline">Run this query</button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loading" class="flex justify-start">
          <div class="bg-gray-100 text-gray-400 rounded-xl px-3 py-2 text-xs italic">Thinking…</div>
        </div>
      </div>

      <div class="border-t border-gray-100 px-4 py-3" :class="{ 'opacity-30 pointer-events-none': modelStage !== 'ready' }">
        <form @submit.prevent="sendMessage" class="flex gap-2">
          <input v-model="inputText" type="text" placeholder="Ask about your data…"
            class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            :disabled="loading" />
          <button type="submit" :disabled="!inputText.trim() || loading || modelStatus === 'loading'"
            class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors">
            Send
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useModel } from '../lib/model'

const emit = defineEmits(['apply-chart', 'run-sql'])

const props = defineProps({
  schemaText: { type: String, default: '' },
  embedded: { type: Boolean, default: false },
  runSql: { type: Function, default: null },
})

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const messagesRef = ref(null)

const { modelStatus, modelProgress, modelError, modelStage, modelConsent, giveConsent, chat, ensureLoaded } = useModel()

function approveModel() {
  giveConsent()
  ensureLoaded().catch(() => {})
}

async function fetchRelevantData(question) {
  if (!props.runSql) return null
  const tableMatch = question.match(/\b(\w+)\b/g) || []
  const schemaTables = (props.schemaText.match(/Table:\s*(\w+)/g) || []).map(t => t.replace('Table: ', ''))
  const mentioned = schemaTables.filter(t => tableMatch.some(w => w.toLowerCase() === t.toLowerCase()))
  if (!mentioned.length) return null
  try {
    const rows = await props.runSql('SELECT * FROM "' + mentioned[0] + '" LIMIT 5')
    return rows
  } catch { return null }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''
  messages.value.push({ role: 'user', text })
  loading.value = true
  try {
    if (modelStatus.value !== 'ready') {
      try {
        await ensureLoaded()
      } catch {
        messages.value.push({ role: 'assistant', text: 'Could not load the AI model. ' + (modelError.value || 'Try again later.') })
        loading.value = false
        return
      }
    }
    const dataSamples = await fetchRelevantData(text)
    const result = await chat(props.schemaText, text, dataSamples)
    messages.value.push({ role: 'assistant', text: result.text, charts: result.charts, sql: result.sql })
  } catch {
    messages.value.push({ role: 'assistant', text: 'Sorry, I could not process that. Check that the model is available.' })
  }
  loading.value = false
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}
</script>

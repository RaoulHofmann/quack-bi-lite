<template>
  <div class="bg-white overflow-hidden flex flex-col" :class="embedded ? 'flex-1 min-h-0 border-0 rounded-none' : 'border border-gray-200 rounded-xl'" :style="embedded ? {} : { height: '500px' }">
    <div class="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Chat with your data</h3>
      <div class="flex items-center gap-2">
        <span v-if="modelStatus === 'loading'" class="text-xs text-purple-500">Loading model ({{ modelProgress }}%)…</span>
        <span v-else-if="modelStatus === 'ready'" class="text-xs text-green-500">Model ready</span>
        <span v-else-if="modelStatus === 'error'" class="text-xs text-red-500 truncate max-w-[120px]" :title="modelError">Model error</span>
      </div>
    </div>

    <div ref="messagesRef" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
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
            <!-- Suggested charts -->
            <div v-if="msg.charts && msg.charts.length" class="mt-2 space-y-1 border-t border-gray-200 pt-2">
              <p class="text-xs font-medium text-gray-500">Suggested charts:</p>
              <button v-for="(c, ci) in msg.charts" :key="ci" @click="$emit('apply-chart', c)"
                class="w-full text-left text-xs border border-purple-200 rounded-lg px-2.5 py-1.5 hover:bg-purple-50 transition-colors">
                <span class="block font-medium text-purple-700">{{ c.label }}</span>
                <span class="text-gray-400">{{ c.xCol }} → {{ c.agg }} of {{ c.yCol }} ({{ c.chartType }})</span>
              </button>
            </div>
            <!-- SQL -->
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

    <div class="border-t border-gray-100 px-4 py-3">
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

const { modelStatus, modelProgress, modelError, chat, ensureLoaded } = useModel()

async function fetchRelevantData(question) {
  if (!props.runSql) return null
  const tableMatch = question.match(/\b(\w+)\b/g) || []
  const schemaTables = (props.schemaText.match(/Table:\s*(\w+)/g) || []).map(t => t.replace('Table: ', ''))
  const mentioned = schemaTables.filter(t => tableMatch.some(w => w.toLowerCase() === t.toLowerCase()))
  if (!mentioned.length) return null
  try {
    const rows = await props.runSql('SELECT * FROM "' + mentioned[0] + '" LIMIT 5')
    return { table: mentioned[0], rows }
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

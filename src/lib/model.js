import { ref } from 'vue'
import { pipeline, env } from '@huggingface/transformers'

const MODEL_ID = 'Xenova/LaMini-GPT-124M'
const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
const MODELS_URL = window.location.origin + baseUrl + 'models/'
const WASM_URL = window.location.origin + baseUrl + 'wasm/'

env.localModelPath = MODELS_URL
env.allowLocalModels = true
env.allowRemoteModels = true
env.allowCache = true
env.backends.onnx.wasm.wasmPaths = WASM_URL

let pipelineRef = null
export const modelStatus = ref('idle')
export const modelProgress = ref(0)
export const modelError = ref('')

function parseChartSuggestion(text) {
  const suggestions = []
  const blocks = text.split(/(?=Chart:)/).filter(Boolean)
  for (const block of blocks) {
    const title = block.match(/Chart:\s*(.+)/)
    const type = block.match(/Type:\s*(\w+)/)
    const x = block.match(/X:\s*(.+)/)
    const y = block.match(/Y:\s*(.+)/)
    const agg = block.match(/Aggregation:\s*(\w+)/)
    if (title && x && y) {
      suggestions.push({
        label: title[1].trim(),
        chartType: (type ? type[1].trim() : 'bar').toLowerCase(),
        xCol: x[1].trim(),
        yCol: y[1].trim(),
        agg: agg ? agg[1].trim().toUpperCase() : 'SUM',
      })
    }
  }
  return suggestions
}

function extractSql(text) {
  const m = text.match(/```sql\s*([\s\S]*?)```/)
  return m ? m[1].trim() : null
}

function buildPrompt(schemaText, question) {
  return `You are a data assistant. Given this database schema, answer questions and suggest charts.

Schema:
${schemaText}

When suggesting a chart, use this format:
Chart: [title]
Type: [bar|line|pie]
X: [column name]
Y: [column name]
Aggregation: [SUM|AVG|COUNT]

When writing SQL, use:
\`\`\`sql
SELECT ... FROM "table" ...
\`\`\`

Question: ${question}

Answer:`
}

async function localModelsExist() {
  try {
    const r = await fetch(MODELS_URL + MODEL_ID + '/onnx/model_fp16.onnx', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    return r.ok
  } catch {
    return false
  }
}

async function ensureLoaded() {
  if (pipelineRef) return pipelineRef
  modelError.value = ''
  modelStatus.value = 'loading'

  try {
    const localOk = await localModelsExist()
    env.allowRemoteModels = localOk ? false : true

    pipelineRef = await pipeline('text-generation', MODEL_ID, {
      dtype: 'fp16',
      progress_callback: (p) => {
        if (p.status === 'progress' && p.total) {
          modelProgress.value = Math.round((p.loaded / p.total) * 100)
        }
      },
    })
    modelStatus.value = 'ready'
    return pipelineRef
  } catch (err) {
    console.error('[model]', err.message)
    modelError.value = err.message || String(err)
    modelStatus.value = 'error'
    // Reset so retries can try different settings
    env.localModelPath = ''
    env.allowRemoteModels = true
    pipelineRef = null
    throw err
  }
}

async function suggestCharts(schemaText) {
  const pipe = await ensureLoaded()
  const prompt = buildPrompt(schemaText, 'Suggest 2-3 charts to visualize this data.')
  const r = await pipe(prompt, { max_new_tokens: 200, temperature: 0.3, do_sample: true, top_p: 0.9 })
  const reply = (r[0]?.generated_text || '').slice(prompt.length).trim()
  return parseChartSuggestion(reply)
}

async function chat(schemaText, question) {
  const pipe = await ensureLoaded()
  const prompt = buildPrompt(schemaText, question)
  const r = await pipe(prompt, { max_new_tokens: 300, temperature: 0.4, do_sample: true, top_p: 0.9 })
  const reply = (r[0]?.generated_text || '').slice(prompt.length).trim()
  return { text: reply, charts: parseChartSuggestion(reply), sql: extractSql(reply) }
}

function resetModel() {
  pipelineRef = null
  modelStatus.value = 'idle'
  modelProgress.value = 0
  modelError.value = ''
}

export function useModel() {
  return { modelStatus, modelProgress, modelError, suggestCharts, chat, localModelsExist, ensureLoaded, resetModel, MODEL_ID }
}

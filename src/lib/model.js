import { ref } from 'vue'
import { pipeline, env } from '@huggingface/transformers'

const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct'
const DTYPE = 'q4'
const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
const MODELS_PATH = import.meta.env.DEV ? '/models/' : baseUrl + 'models/'
const WASM_PATH = baseUrl + 'wasm/'

env.localModelPath = MODELS_PATH
env.allowLocalModels = true
env.allowRemoteModels = true
env.allowCache = true
env.backends.onnx.wasm.wasmPaths = WASM_PATH

let pipelineRef = null
export const modelStatus = ref('idle')
export const modelProgress = ref(0)
export const modelError = ref('')
export const modelConsent = ref(false)
export const modelStage = ref('consent') // consent | checking | downloading | optimizing | ready | error

export function giveConsent() {
  modelConsent.value = true
}

function resetStage() {
  modelStage.value = 'consent'
  modelProgress.value = 0
  modelError.value = ''
}

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

function buildChatPrompt(schemaText, rows, question) {
  const samples = rows && rows.length
    ? '\nSample rows:\n' + JSON.stringify(rows.slice(0, 3), null, 2)
    : ''

  return `<|im_start|>system
You are a data analyst. Answer in 1-2 sentences using the schema below.
Never write SQL. Never suggest charts.

Schema:
${schemaText}${samples}
<|im_end|>
<|im_start|>user
${question}
<|im_end|>
<|im_start|>assistant`
}

function buildSuggestPrompt(schemaText) {
  return `<|im_start|>system
Given this schema, suggest 2 charts.
Output only:
Chart: title
Type: bar|line|pie
X: column
Y: column
Aggregation: SUM|AVG|COUNT

Schema:
${schemaText}
<|im_end|>
<|im_start|>user
Suggest 2 charts for this data.
<|im_end|>
<|im_start|>assistant`
}

function modelFileName() {
  return `onnx/model_${DTYPE}.onnx`
}

async function localModelsExist() {
  try {
    const onnx = fetch(MODELS_PATH + MODEL_ID + '/' + modelFileName(), { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const genCfg = fetch(MODELS_PATH + MODEL_ID + '/generation_config.json', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const [a, b] = await Promise.all([onnx, genCfg])
    return a.ok && b.ok
  } catch {
    return false
  }
}

let stallTimer = null

function clearStallTimer() {
  if (stallTimer) {
    clearTimeout(stallTimer)
    stallTimer = null
  }
}

async function ensureLoaded() {
  if (pipelineRef) return pipelineRef
  modelError.value = ''
  modelStatus.value = 'loading'
  modelStage.value = 'checking'
  modelProgress.value = 0

  try {
    const localOk = await localModelsExist()
    env.allowRemoteModels = localOk ? false : true
    modelStage.value = 'checking'

    pipelineRef = await pipeline('text-generation', MODEL_ID, {
      dtype: DTYPE,
      progress_callback: (p) => {
        if (p.status === 'progress' && p.total) {
          modelProgress.value = Math.round((p.loaded / p.total) * 100)
          if (modelStage.value !== 'optimizing') {
            modelStage.value = 'downloading'
          }
          clearStallTimer()
          stallTimer = setTimeout(() => {
            if (modelStage.value === 'downloading' && modelStatus.value === 'loading') {
              modelStage.value = 'optimizing'
            }
          }, 2000)
        }
      },
    })
    clearStallTimer()
    modelStage.value = 'ready'
    modelStatus.value = 'ready'
    return pipelineRef
  } catch (err) {
    console.error('[model]', err.message)
    modelError.value = err.message || String(err)
    modelStage.value = 'error'
    modelStatus.value = 'error'
    pipelineRef = null
    clearStallTimer()
    throw err
  }
}

async function suggestCharts(schemaText) {
  const pipe = await ensureLoaded()
  const prompt = buildSuggestPrompt(schemaText)
  const r = await pipe(prompt, { max_new_tokens: 200, do_sample: false })
  const generated = r[0]?.generated_text || ''
  const reply = generated.includes('<|im_start|>assistant')
    ? generated.split('<|im_start|>assistant').pop().trim()
    : generated.slice(prompt.length).trim()
  return parseChartSuggestion(reply)
}

async function chat(schemaText, question, rows) {
  const pipe = await ensureLoaded()
  const prompt = buildChatPrompt(schemaText, rows, question)
  const r = await pipe(prompt, { max_new_tokens: 200, do_sample: false })
  const generated = r[0]?.generated_text || ''
  const reply = generated.includes('<|im_start|>assistant')
    ? generated.split('<|im_start|>assistant').pop().trim()
    : generated.slice(prompt.length).trim()
  return { text: reply, charts: parseChartSuggestion(reply), sql: extractSql(reply) }
}

function resetModel() {
  pipelineRef = null
  modelStatus.value = 'idle'
  resetStage()
}

export function useModel() {
  return { modelStatus, modelProgress, modelError, modelConsent, modelStage, giveConsent, suggestCharts, chat, localModelsExist, ensureLoaded, resetModel, MODEL_ID }
}

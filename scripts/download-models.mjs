import { mkdirSync, existsSync, createWriteStream, rmSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct'
const DTYPE = 'q4'
const OUT_DIR = resolve(__dirname, '..', 'public/models')
const HF_BASE = `https://huggingface.co/${MODEL_ID}/resolve/main`

const FILES = [
  'config.json',
  'tokenizer.json',
  'tokenizer_config.json',
  `onnx/model_${DTYPE}.onnx`,
]

async function downloadFile(url, dest) {
  const dir = dirname(dest)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const headers = {}
  if (process.env.HF_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.HF_TOKEN}`
  }

  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${url}`)

  const body = resp.body
  if (!body) {
    const buf = Buffer.from(await resp.arrayBuffer())
    const { writeFileSync } = await import('fs')
    writeFileSync(dest, buf)
    return
  }

  const reader = body.getReader()
  const writer = createWriteStream(dest)

  const pump = async () => {
    while (true) {
      const { done, value } = await reader.read()
      if (done) { writer.end(); break }
      writer.write(value)
    }
  }

  await pump()

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

function allFilesExist() {
  return FILES.every(f => {
    const dest = join(OUT_DIR, MODEL_ID, f)
    return existsSync(dest) && statSync(dest).size > 0
  })
}

async function main() {
  if (allFilesExist()) {
    console.log(`Model files already cached at public/models/${MODEL_ID}/ — skipping download`)
    return
  }

  console.log(`Downloading ${MODEL_ID} (${DTYPE})...`)

  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true, force: true })
  }
  mkdirSync(OUT_DIR, { recursive: true })

  for (const file of FILES) {
    const url = `${HF_BASE}/${file}`
    const dest = join(OUT_DIR, MODEL_ID, file)
    process.stdout.write(`  ${file} ... `)
    await downloadFile(url, dest)
    const size = statSync(dest).size
    process.stdout.write(`${(size / 1024 / 1024).toFixed(1)}MB\n`)
  }

  console.log(`\n✓ Model files downloaded to public/models/${MODEL_ID}/`)
}

main().catch(err => {
  console.error('\n✗ Download failed:', err.message)
  process.exit(1)
})

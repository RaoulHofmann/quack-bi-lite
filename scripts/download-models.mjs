import { pipeline } from "@huggingface/transformers";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { mkdirSync, existsSync, copyFileSync, readdirSync, statSync, rmSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODEL_ID = "HuggingFaceTB/SmolLM2-135M-Instruct";
const DTYPE = "q4";
const OUT_DIR = resolve(__dirname, "..", "public/models");
const CACHE_DIR = resolve(__dirname, "..", "node_modules/@huggingface/transformers/.cache");

function copyDir(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  const modelOutDir = join(OUT_DIR, MODEL_ID);
  const onnxPath = join(modelOutDir, "onnx", `model_${DTYPE}.onnx`);

  if (existsSync(onnxPath) && statSync(onnxPath).size > 50 * 1024 * 1024) {
    console.log(`Model files already cached at public/models/${MODEL_ID}/ — skipping download`);
    return
  }

  console.log(`Downloading ${MODEL_ID} (${DTYPE})...`);
  console.log("Creating pipeline (triggers model download)...");

  await pipeline("text-generation", MODEL_ID, { dtype: DTYPE });

  console.log("Model ready. Copying to public/models/...");

  const modelCacheDir = join(CACHE_DIR, MODEL_ID);
  copyDir(modelCacheDir, modelOutDir);

  console.log(`\n✓ Model files in public/models/${MODEL_ID}/`);
  console.log(`  Files: ${readdirSync(modelOutDir).join(", ")}`);
}

main().catch(err => {
  console.error("\n✗ Download failed:", err.message);
  process.exit(1);
})

# Quack BI Lite — Technical Documentation

## Architecture

Quack BI Lite is a fully client-side browser app. No backend server. All data processing, SQL execution, chart rendering, and export happens in the user's browser.

### Data flow

```
CSV upload → DuckDB-WASM (in-browser SQL) → Chart.js (rendering) → Excel/PDF export
                              ↕
                    Explore step (data grid, SQL, pivot, chat)
                              ↕
                    Build step (canvas, charts, joins)
```

### Key technologies

| Component | Library | Role |
|---|---|---|
| **SQL engine** | DuckDB-WASM | Parses CSV, runs SQL queries, supports joins |
| **Charts** | Chart.js + vue-chartjs | Renders bar, line, pie, doughnut, polar, radar |
| **Excel export** | ExcelJS | Creates multi-sheet workbooks with charts + formulas |
| **PDF export** | jsPDF + html2canvas | Generates printable report documents |
| **Local AI** | 🤗 Transformers.js | Runs a 124M-parameter LLM in-browser for chart suggestions |
| **Offline** | Service Worker | Caches assets, provides COOP/COEP headers for DuckDB |

---

## Local AI Model

The app includes an optional on-device AI that suggests charts and answers questions about your data.

### How it works

1. When you click **AI suggest** in the Build step or send a message in the Chat panel, the app loads `Xenova/LaMini-GPT-124M` — a 124M-parameter text-generation model converted to ONNX format.
2. The model runs entirely in-browser via `@huggingface/transformers` (Transformers.js). No data leaves your machine.
3. The model receives the database schema (table names, column names, types) and your question, then generates structured chart suggestions or SQL queries.
4. Chart suggestions are parsed from the model output and displayed as clickable cards that create pre-configured charts on the canvas.

### Prompt format

The model is prompted like this:

```
You are a data assistant. Given this database schema, answer questions and suggest charts.

Schema:
Table: sales
Columns: Region (VARCHAR), Product (VARCHAR), Sales (DOUBLE), ...

When suggesting a chart, use this format:
Chart: [title]
Type: [bar|line|pie]
X: [column name]
Y: [column name]
Aggregation: [SUM|AVG|COUNT]

Question: Suggest 2-3 charts to visualize this data.

Answer:
```

The structured output is parsed to extract chart configurations and SQL queries.

### Model sources

By default, the model is downloaded from Hugging Face on first use (~50MB). You can self-host it:

```bash
npm run build:models
# or as part of a full build:
npm run generate
# or as part of deployment:
npm run deploy
```

This places the model files in `public/models/Xenova/LaMini-GPT-124M/`. The app detects local files and loads from there instead of Hugging Face. Useful for offline use or if Hugging Face is inaccessible.

### Why LaMini-GPT-124M?

- **124M parameters** — small enough to run on CPU in any modern browser
- **ONNX format** — converted for efficient inference via Transformers.js
- **~50MB download** — cached by the service worker after first load
- **Structured output** — good at following format instructions for chart/SQL generation

---

## Service Worker

The service worker (`public/service-worker.js`) serves two purposes:

### 1. COOP/COEP headers (critical for DuckDB-WASM)

DuckDB-WASM uses `SharedArrayBuffer` for multi-threaded query execution. This requires the page to be cross-origin isolated. The service worker intercepts all fetch responses and adds:

```
Cross-Origin-Embedder-Policy: credentialless
Cross-Origin-Opener-Policy: same-origin
```

Without these headers, DuckDB falls back to single-threaded mode (slower queries).

### 2. Offline caching

- **Install**: Caches the app shell (`/`)
- **Fetch**: Network-first strategy — tries the network, falls back to cache
- **WASM/Worker files**: Cached after first download (large files like DuckDB's `.wasm` and Hugging Face model files)
- **Hugging Face**: Model requests pass through without COEP modification
- **Offline**: Returns cached content; shows a 503 if nothing cached

### Registration

Registered in `src/main.js` with relative path `service-worker.js` and empty scope (defaults to app's directory — `/quack-bi-lite/` on GitHub Pages).

---

## Export Pipeline

### Excel (ExcelJS)

Output: Multi-sheet `.xlsx` workbook

| Sheet | Content |
|---|---|
| **Cover** | Report title, dashboard screenshot (hero image), generated date, table list, chart index |
| **{table_name}** | One sheet per loaded CSV table — all rows with auto-filters and alternating row styling |
| **All Data** | Joined data from all tables (if joins configured) |
| **{chart_title}** | Per-chart sheet: data table + embedded chart image (preserving aspect ratio) |

**Smart formulas**: Chart data values use Excel formulas (SUMIF, AVERAGEIF, etc.) that reference the "All Data" sheet. Clicking a value in Excel shows the formula reference rather than a static number.

### PDF (jsPDF + html2canvas)

- **Cover page**: Report name, generated date, data sources, chart index
- **Dashboard page**: Full canvas screenshot (landscape, aspect-ratio preserved)
- **Chart pages**: One per chart with image, metadata, and data sample table

### JSON

Exports the full report config (chart settings, join config, table metadata) as a JSON file. Re-importable.

---

## GitHub Pages Deployment

```bash
npm run build     # Build to dist/ with base: /quack-bi-lite/
npm run deploy    # Build + gh-pages to gh-pages branch
```

The `base` in `vite.config.js` must match the repository name.

If you self-host the model, run `npm run build:models` before building so model files are included in `dist/`. The `generate` script runs both steps, suitable for CI pipelines.

---

## Data Privacy

- CSV data **never leaves the browser**
- All DuckDB querying is client-side
- The AI model runs locally — your schema and questions are never sent to any server
- Model files are cached by the service worker for offline use
- No cookies, no tracking, no analytics
- If you delete the model files, the app falls back to rule-based chart suggestions

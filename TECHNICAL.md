# Quack BI Lite — Technical Documentation

## Architecture

Quack BI Lite is a fully client-side browser app. No backend server. All data processing, SQL execution, chart rendering, and export happens in the user's browser.

### Data flow

```
CSV upload → DuckDB-WASM (in-browser SQL) → Chart.js (rendering) → Excel/PDF export
                              ↕
                    Explore step (data grid, SQL, pivot)
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
| **Offline** | Service Worker | Caches assets, provides COOP/COEP headers for DuckDB |

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
- **WASM/Worker files**: Cached after first download (large files like DuckDB's `.wasm`)
- **Offline**: Returns cached content; shows a 503 if nothing cached

### Registration

Registered in `src/main.js` with relative path `service-worker.js` and empty scope (defaults to app's directory — `/quack-bi-lite/` on GitHub Pages).

---

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

---

## Data Privacy

- CSV data **never leaves the browser**
- All DuckDB querying is client-side
- No cookies, no tracking, no analytics

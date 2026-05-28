import * as duckdb from '@duckdb/duckdb-wasm'
import mvpWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import ehWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import coiWasmUrl from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url'
import mvpWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import ehWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import coiWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url'
import coiPthreadWorkerUrl from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url'

let db = null
let conn = null

async function initDuckDB() {
  const bundles = {
    mvp: { mainModule: mvpWasmUrl, mainWorker: mvpWorkerUrl },
    eh: { mainModule: ehWasmUrl, mainWorker: ehWorkerUrl },
    coi: { mainModule: coiWasmUrl, mainWorker: coiWorkerUrl, pthreadWorker: coiPthreadWorkerUrl },
  }
  const bundle = await duckdb.selectBundle(bundles)
  const worker = new Worker(bundle.mainWorker)
  const logger = new duckdb.ConsoleLogger()
  const instance = new duckdb.AsyncDuckDB(logger, worker)
  await instance.instantiate(bundle.mainModule, bundle.pthreadWorker)
  return instance
}

export function useDuckDb() {
  async function getConnection() {
    if (!db) db = await initDuckDB()
    if (!conn) conn = await db.connect()
    return { db, conn }
  }

  function cleanValue(v) {
    if (v == null) return null
    if (typeof v === 'bigint') return Number(v)
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const t = v.trim()
      if (t.startsWith('"') && t.endsWith('"')) return cleanValue(t.slice(1, -1))
      if (t !== '' && !isNaN(Number(t))) return Number(t)
      if (t === '' || t === '-' || t === '\u2014') return null
      return t
    }
    return v
  }

  function toPlain(rows) {
    return rows.map(r => {
      const obj = {}
      for (const key of Object.keys(r)) { obj[key] = cleanValue(r[key]) }
      return obj
    })
  }

  async function runSqlQuery(sql) {
    const { conn } = await getConnection()
    try {
      const res = await conn.query(sql)
      return toPlain(res.toArray())
    } catch { return [] }
  }

  async function fetchFullTableData(tableName) {
    const { conn } = await getConnection()
    try {
      const res = await conn.query('SELECT * FROM "' + tableName + '"')
      return toPlain(res.toArray())
    } catch { return [] }
  }

  async function registerCSV(file, tableName) {
    const { db, conn } = await getConnection()
    const buf = new Uint8Array(await file.arrayBuffer())
    await db.registerFileBuffer(file.name, buf)
    await conn.insertCSVFromPath(file.name, { name: tableName, detect: true })

    const info = await conn.query('DESCRIBE ' + tableName)
    const columns = info.toArray().map(r => ({ name: r.column_name, type: r.column_type }))

    const preview = await conn.query('SELECT * FROM ' + tableName + ' LIMIT 50')
    const rows = toPlain(preview.toArray())

    const countRes = await conn.query('SELECT COUNT(*) AS cnt FROM ' + tableName)
    const rowCount = Number(countRes.toArray()[0].cnt)

    return { columns, rows, rowCount }
  }

  function buildFromClause(chartTable, joinsList, tables) {
    if (!joinsList || !joinsList.length) return '"' + (chartTable || (tables?.[0]?.name || 'raw_data')) + '"'
    let from = ''
    for (const j of joinsList) {
      if (!from) from = '"' + j.table1 + '"'
      from += ' ' + j.type + ' JOIN "' + j.table2 + '" ON "' + j.table1 + '"."' + j.col1 + '" = "' + j.table2 + '"."' + j.col2 + '"'
    }
    if (chartTable && !from.includes(chartTable)) {
      from = '"' + chartTable + '", ' + from
    }
    return from
  }

  async function registerExcel(file, tableName) {
    const { db, conn } = await getConnection()
    const buf = await file.arrayBuffer()
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buf, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const csvContent = XLSX.utils.sheet_to_csv(sheet)
    const csvFile = new File([csvContent], file.name.replace(/\.xlsx?$/i, '.csv'), { type: 'text/csv' })
    return registerCSV(csvFile, tableName)
  }

  async function registerJSON(file, tableName) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data) || !data.length) throw new Error('JSON must be a non-empty array of objects')
    const headers = Object.keys(data[0])
    const csvRows = data.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val == null) return ''
        if (typeof val === 'string') return '"' + val.replace(/"/g, '""') + '"'
        return String(val)
      }).join(',')
    )
    const csvContent = headers.join(',') + '\n' + csvRows.join('\n')
    const csvFile = new File([csvContent], tableName + '.csv', { type: 'text/csv' })
    return registerCSV(csvFile, tableName)
  }

  async function createTableFromQuery(tableName, sql) {
    const { conn } = await getConnection()
    await conn.query('CREATE TABLE "' + tableName + '" AS (' + sql + ')')

    const info = await conn.query('DESCRIBE "' + tableName + '"')
    const columns = info.toArray().map(r => ({ name: r.column_name, type: r.column_type }))

    const preview = await conn.query('SELECT * FROM "' + tableName + '" LIMIT 50')
    const rows = toPlain(preview.toArray())

    const countRes = await conn.query('SELECT COUNT(*) AS cnt FROM "' + tableName + '"')
    const rowCount = Number(countRes.toArray()[0].cnt)

    return { columns, rows, rowCount }
  }

  async function fetchAllData(joinsList, tables) {
    const { conn } = await getConnection()
    if (!tables.length) return []
    try {
      const from = buildFromClause(tables[0].name, joinsList, tables)
      const res = await conn.query('SELECT * FROM ' + from + ' LIMIT 5000')
      return toPlain(res.toArray())
    } catch { return [] }
  }

  return {
    getConnection, runSqlQuery, fetchFullTableData,
    registerCSV, registerExcel, registerJSON, createTableFromQuery,
    buildFromClause, fetchAllData,
    cleanValue, toPlain,
  }
}

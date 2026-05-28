import { ref, computed } from 'vue'

let _registerCSV, _registerExcel, _registerJSON

export function useDataSources(opts) {
  if (opts) {
    _registerCSV = opts.registerCSV
    _registerExcel = opts.registerExcel
    _registerJSON = opts.registerJSON
  }
  const registerCSV = _registerCSV
  const registerExcel = _registerExcel
  const registerJSON = _registerJSON
  const tables = ref([])
  const loadingSamples = ref(false)
  const usedTableNames = new Set()

  let idCounter = 0
  function uid() { return (Date.now() + ++idCounter).toString(36) }

  const allColumns = computed(() => tables.value.flatMap(t => t.columns))

  const allNumericCols = computed(() => allColumns.value.filter(c =>
    ['INTEGER', 'DOUBLE', 'BIGINT', 'FLOAT', 'DECIMAL', 'HUGEINT', 'SMALLINT', 'TINYINT'].some(t => c.type.toUpperCase().includes(t))
  ))

  const allRows = computed(() => {
    if (!tables.value.length) return []
    return tables.value[0]?.rows || []
  })

  async function handleFileUpload(file) {
    try {
      const baseName = file.name.replace(/\.[^.]+$/i, '').replace(/[^a-zA-Z0-9_]/g, '_')
      let tableName = baseName
      let suffix = 1
      while (usedTableNames.has(tableName)) { tableName = baseName + '_' + suffix; suffix++ }
      usedTableNames.add(tableName)

      const ext = file.name.split('.').pop().toLowerCase()
      let result
      if (ext === 'csv') {
        result = await registerCSV(file, tableName)
      } else if (ext === 'xlsx' || ext === 'xls') {
        result = await registerExcel(file, tableName)
      } else if (ext === 'json') {
        result = await registerJSON(file, tableName)
      } else {
        throw new Error('Unsupported file type: .' + ext)
      }

      tables.value = [...tables.value, { name: tableName, fileName: file.name, ...result }]
    } catch (err) {
      console.error(err)
      const { useToast } = await import('../lib/toast')
      useToast().showToast('Could not read the file ' + file.name, 'error')
    }
  }

  async function loadSampleData() {
    loadingSamples.value = true
    const base = import.meta.env.BASE_URL || '/'
    const files = ['sales.csv', 'products.csv', 'employees.csv']
    for (const f of files) {
      try {
        const resp = await fetch(base + 'test_data/' + f)
        const blob = await resp.blob()
        const file = new File([blob], f, { type: 'text/csv' })
        await handleFileUpload(file)
      } catch (err) {
        console.error('Could not load sample file:', f, err)
      }
    }
    loadingSamples.value = false
  }

  function removeTable(name, onRemove) {
    tables.value = tables.value.filter(t => t.name !== name)
    usedTableNames.delete(name)
    if (onRemove) onRemove(name)
  }

  function getColumns(tableName) {
    const t = tables.value.find(x => x.name === tableName)
    return t?.columns || []
  }

  function registerTableFromQuery(tableName, tableData) {
    usedTableNames.add(tableName)
    tables.value = [...tables.value, { name: tableName, fileName: tableName, ...tableData }]
  }

  return {
    tables, loadingSamples, allColumns, allNumericCols, allRows,
    handleFileUpload, loadSampleData, removeTable, getColumns, registerTableFromQuery,
    uid,
  }
}

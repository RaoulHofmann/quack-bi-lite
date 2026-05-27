import { ref } from 'vue'
import { gridModel, GridModel } from './konvaGridModel'

const chartRanges = ref([])

export function useSpreadsheetState() {
  function initFromTables(tables, joinedData, pivots) {
    gridModel.initFromTables(tables, joinedData, pivots)
  }

  function setActiveSheet(index) {
    gridModel.setActiveSheet(index)
  }

  function getActiveInstance() {
    return gridModel.getActiveSheet()
  }

  function getCellData(sheetIndex) {
    const sheet = gridModel.sheets[sheetIndex]
    if (!sheet) return []
    return sheet.getDataArray(0, 0, sheet.rowCount - 1, sheet.colCount - 1)
  }

  function getSelectedRange() {
    const sheet = gridModel.getActiveSheet()
    if (!sheet || !gridModel.activeCell) return null
    const range = gridModel.selectionRange
    if (!range) return null
    const sheetName = sheet.name
    const startCol = GridModel.colLetter(range.col1)
    const endCol = GridModel.colLetter(range.col2)
    return {
      sheet: sheetName,
      sheetIndex: gridModel.activeSheetIndex,
      range: `${startCol}${range.row1 + 1}:${endCol}${range.row2 + 1}`,
      col1: range.col1, row1: range.row1,
      col2: range.col2, row2: range.row2,
      values: gridModel.getSelectedRangeData(),
    }
  }

  function getDataForExport() {
    return gridModel.getExportData()
  }

  function getSheetDataArray(sheetIndex) {
    return getCellData(sheetIndex)
  }

  function addChartRange(chartId, rangeInfo) {
    const existing = chartRanges.value.findIndex(r => r.chartId === chartId)
    const entry = { chartId, ...rangeInfo }
    if (existing >= 0) {
      chartRanges.value[existing] = entry
    } else {
      chartRanges.value.push(entry)
    }
    if (rangeInfo && rangeInfo.row1 != null) {
      gridModel.addChartAnchor(chartId, rangeInfo.row1, rangeInfo.col1, {
        sheetIndex: rangeInfo.sheetIndex ?? gridModel.activeSheetIndex,
        data: rangeInfo.values,
        range: rangeInfo.range,
      })
    }
  }

  function removeChartRange(chartId) {
    chartRanges.value = chartRanges.value.filter(r => r.chartId !== chartId)
    gridModel.removeChartAnchor(chartId)
  }

  function getChartRangeData(chartId) {
    const range = chartRanges.value.find(r => r.chartId === chartId)
    if (!range) return null
    return range.values || null
  }

  return {
    sheetData: ref(gridModel.sheets),
    sheetConfigs: ref([]),
    activeSheet: ref(gridModel.activeSheetIndex),
    spreadsheetInstance: ref(null),
    chartRanges,
    initFromTables,
    setActiveSheet,
    getActiveInstance,
    getCellData,
    setActiveSheet,
    getSelectedRange,
    getDataForExport,
    getSheetDataArray,
    addChartRange,
    removeChartRange,
    getChartRangeData,
  }
}

export const spreadsheetState = useSpreadsheetState()

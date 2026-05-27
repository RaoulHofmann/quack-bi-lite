<template>
  <div>
    <div class="mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-800">Save and export</h2>
        <p class="text-sm text-gray-500 mt-1">Save your report in your browser or export it.</p>
      </div>
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-600 mb-1">Report name</label>
      <input v-model="dashboardName" type="text"
        class="w-full max-w-sm border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Monthly Sales Report" />
    </div>
    <ExportTools
      :report-config="reportConfig"
      :has-data="charts.length > 0 || canvasTables.length > 0"
      :raw-columns="allColumns"
      :raw-rows="allRows"
      :tables="tables"
      :chart-data-query="fetchAllData"
      :chart-images="capturedImages"
      :dashboard-image="capturedDashboardImage"
      :canvas-tables="canvasTables"
      :fetch-full-table="fetchFullTableData"
      :capture-dashboard="captureDashboardScreenshot"
      @load-report="onLoadReport"
    />
  </div>
</template>

<script setup>
import { useDashboard } from '../../lib/useDashboard'
import ExportTools from '../ExportTools.vue'

const {
  dashboardName, reportConfig, charts, canvasTables, allColumns, allRows,
  tables, fetchAllData, capturedImages, capturedDashboardImage,
  fetchFullTableData, captureDashboardScreenshot, onLoadReport,
} = useDashboard()
</script>

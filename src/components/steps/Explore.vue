<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800">Explore your data</h2>
      <p class="text-sm text-gray-500 mt-1">Browse tables, profile columns, and run ad-hoc SQL queries before building charts.</p>
    </div>
    <DataExplorer
      :tables="tables"
      :fetch-full-table="fetchFullTableData"
      :run-sql="runSqlQuery"
    />
    <div class="flex gap-3 mt-6">
      <button @click="goToStep(1)" class="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Back</button>
      <button @click="goToStep(3)" class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
        Continue to build
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDashboard } from '../../lib/useDashboard'
import DataExplorer from '../DataExplorer.vue'

const {
  tables, goToStep,
  fetchFullTableData, runSqlQuery,
} = useDashboard()
</script>

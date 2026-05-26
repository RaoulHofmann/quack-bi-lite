<template>
  <div
    class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
    :class="dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
    @click="openFilePicker"
  >
    <input type="file" accept=".csv" class="hidden" ref="inputRef" @change="onFile" />
    <div class="space-y-4">
      <svg class="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <div>
        <p class="text-gray-600 font-medium">Drop a CSV file here</p>
        <p class="text-gray-400 text-sm mt-1">or click to browse</p>
      </div>
      <p class="text-xs text-gray-400">All data stays on your device. You can upload multiple files.</p>
    </div>
    <p v-if="lastFile" class="mt-2 text-xs text-green-600">Last uploaded: {{ lastFile }}</p>
    <p v-if="loading" class="mt-4 text-blue-600 font-medium text-sm">Loading and parsing file...</p>
    <p v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['uploaded'])
const dragOver = ref(false)
const lastFile = ref('')
const loading = ref(false)
const error = ref('')
const inputRef = ref(null)

function openFilePicker() {
  if (!loading.value) inputRef.value?.click()
}

function onFile(e) {
  const file = e.target.files[0]
  if (file) validateAndEmit(file)
  e.target.value = ''
}

function onDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file) validateAndEmit(file)
}

function validateAndEmit(file) {
  error.value = ''
  if (!file.name.toLowerCase().endsWith('.csv')) {
    error.value = 'Only CSV files are supported. Please select a .csv file.'
    return
  }
  lastFile.value = file.name
  emit('uploaded', file)
}
</script>

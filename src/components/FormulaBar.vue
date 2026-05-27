<template>
  <div class="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50/80 shrink-0">
    <div class="flex items-center gap-1">
      <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">fx</span>
      <input
        ref="addressRef"
        :value="activeCellAddress"
        readonly
        class="w-20 px-1.5 py-1 text-xs font-mono border border-gray-200 rounded bg-white text-center select-none"
        @click="$event.target.select()"
      />
    </div>
    <div class="w-px h-5 bg-gray-200 shrink-0"></div>
    <div class="flex-1 flex items-center">
      <input
        ref="inputRef"
        :value="formulaValue"
        @input="onInput"
        @keydown.enter="onEnter"
        @keydown.escape="onEscape"
        @focus="isFocused = true"
        @blur="isFocused = false"
        placeholder="Enter value or formula (e.g. =SUM(A1:A10))"
        class="w-full px-2 py-1 text-xs font-mono border border-gray-200 rounded bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      />
    </div>
    <div v-if="isFocused && formulaValue.startsWith('=')" class="flex items-center gap-1 shrink-0">
      <button @click="accept" class="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-medium">OK</button>
      <button @click="cancel" class="text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-400">X</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  activeCellAddress: { type: String, default: '' },
  formulaValue: { type: String, default: '' },
})

const emit = defineEmits(['update-formula', 'accept-formula'])

const inputRef = ref(null)
const addressRef = ref(null)
const isFocused = ref(false)

function onInput(e) {
  emit('update-formula', e.target.value)
}

function onEnter() {
  accept()
}

function onEscape() {
  inputRef.value?.blur()
}

function accept() {
  emit('accept-formula')
  inputRef.value?.blur()
}

function cancel() {
  emit('update-formula', '')
  inputRef.value?.blur()
}

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })
</script>

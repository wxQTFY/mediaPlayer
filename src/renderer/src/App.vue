<script setup lang="ts">
// import Versions from './components/Versions.vue'
// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
import Home from '@renderer/views/Home/Home.vue'
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue'

import { usePlayerStore } from '@renderer/store/playerStory';

const playerStore = usePlayerStore()
const isDraggingFiles = ref(false)
let dragDepth = 0

// 使用 onBeforeMount 尽可能早地开始加载
onBeforeMount(() => {
  playerStore.initStore()
})

const hasFiles = (event: DragEvent): boolean =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

const handleDragEnter = (event: DragEvent): void => {
  if (!hasFiles(event)) return
  event.preventDefault()
  dragDepth += 1
  isDraggingFiles.value = true
}

const handleDragOver = (event: DragEvent): void => {
  if (!hasFiles(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const handleDragLeave = (event: DragEvent): void => {
  if (!hasFiles(event)) return
  event.preventDefault()
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingFiles.value = false
}

const handleDrop = (event: DragEvent): void => {
  event.preventDefault()
  dragDepth = 0
  isDraggingFiles.value = false
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length > 0) void playerStore.handleDroppedFiles(files)
}

onMounted(() => {
  window.addEventListener('dragenter', handleDragEnter)
  window.addEventListener('dragover', handleDragOver)
  window.addEventListener('dragleave', handleDragLeave)
  window.addEventListener('drop', handleDrop)
})

onBeforeUnmount(() => {
  window.removeEventListener('dragenter', handleDragEnter)
  window.removeEventListener('dragover', handleDragOver)
  window.removeEventListener('dragleave', handleDragLeave)
  window.removeEventListener('drop', handleDrop)
})

</script>

<template>
  <el-config-provider>
    <Home/>
    <div v-if="isDraggingFiles" class="drop-overlay">
      <div class="drop-indicator">释放以播放视频</div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  pointer-events: none;
  background: rgb(0 0 0 / 55%);
  border: 3px dashed #409eff;
}

.drop-indicator {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}
</style>

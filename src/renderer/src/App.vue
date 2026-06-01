<script setup lang="ts">
// import Versions from './components/Versions.vue'
// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
import Home from '@renderer/views/Home/Home.vue'
import { onBeforeMount } from 'vue'

import { usePlayerStore } from '@renderer/store/playerStory';

const playerStore = usePlayerStore()

// 使用 onBeforeMount 尽可能早地开始加载
onBeforeMount(() => {
  playerStore.initStore()
})

</script>

<template>
  <el-config-provider>
    <Home/>
  </el-config-provider>
</template>


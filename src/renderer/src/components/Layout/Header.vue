<script setup lang="ts">
  import { ref } from 'vue'
  import { CloseBold, Minus } from '@element-plus/icons-vue'
  import {minusWindow,maxWindow, closeWindow}  from '@renderer/api/window'

 //最小化窗口 
  const handleMinus = (): void => {
    minusWindow()
  }
  //最大化窗口
  const isMaximized = ref(false)

  const handleMax = (): void => {
    console.log('最大化窗口')
    maxWindow()
    isMaximized.value = !isMaximized.value
    console.log('isMaximized.value', isMaximized.value)
  }
  //关闭窗口
  const handleClose = (): void => {
    console.log('关闭窗口')
    closeWindow()
  }

</script>

<template>
    <el-row class="h-full" align="middle" justify="end">
        <el-col :span="12" >
            <div class="grid-content ep-bg-purple" >
                <span class="text-2xl">影音播放器</span>
            </div>
        </el-col>
        <el-col :span="12" > 
            <div class="grid-content ep-bg-purple-light flex justify-end gap-5" >
                <el-icon :size="30" style="-webkit-app-region: no-drag" @click="handleMinus"><Minus/></el-icon>
                <el-icon :size="30" style="-webkit-app-region: no-drag" @click="handleMax">
                    <IconFluentMaximize-48-filled  v-if="!isMaximized" />
                    <IconClarityWindow-restore-line v-else />
                </el-icon>
                <el-icon :size="30" style="-webkit-app-region: no-drag" @click="handleClose"><CloseBold/></el-icon>
            </div>
        </el-col>
  </el-row>

</template>

<style scoped lang="scss">
 
</style>

<script setup lang="ts">
  import { ref } from 'vue'
  import logoImg from '@renderer/assets/logo.png'
  import { Folder } from '@element-plus/icons-vue'
  import { usePlayerStore } from '@renderer/store/playerStory'
  
  // const input1 = ref('')
  

  const playerStore = usePlayerStore()

  const input1 = ref('')
   
</script>

<template>
 <div class="main h-full " >
     <div class="h-full flex flex-col items-center justify-center gap-y-10">
      <div class="logo-img">
        <el-image style="width: 100px; height: 100px" :src="logoImg"/>
      </div>
      <div>
        <el-input
        v-model="input1"
        @change="playerStore.handleOpenUrl"
        style="min-width: 600px"
        size="large"
        placeholder="请输入视频地址,格式:http://example.com/video.mp4"
        >
          <template #prepend>视频地址：</template>
        </el-input>
      </div>
       <div>
          <el-button class="w-40" type="primary" size="large" round color="#3B67D3" @click="playerStore.handleLocalFile">
            <template #default>
              <el-icon size="25" ><Folder /></el-icon>
              <span class="text-xl">打开文件</span>
            </template>
            </el-button>
        </div>
    </div>
 </div>
</template>

<style scoped lang="scss">
</style>

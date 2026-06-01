 <script setup lang="ts">
   import { ref,provide } from 'vue'
   import Header from '@renderer/components/Layout/Header.vue'
  //  import Artplayer from '@renderer/components/Artplayer/ArtPlayer.vue'
    // import Aside from '@renderer/components/Layout/Aside.vue'
    // import PlayerPage from '@renderer/views/PlayerPage/PlayerPage.vue'
    import bgImg from '@renderer/assets/bgimg.png'
    import Aside from '@renderer/components/Layout/Aside.vue'
    

  const isCollapse = ref(false)
  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
    console.log('侧边栏状态已切换，当前状态:', isCollapse.value);
  }
  provide ('sidebarContext', {
    isCollapse, 
    toggleCollapse
  })

 </script>
 
<template>
  <div class="common-layout w-full h-full" >
    <el-container class="h-full">
      <el-header class="playerHeader bg-black-111"><Header/></el-header>
      <el-container>
        <el-aside :width="isCollapse ? '0' : '260px'" >
          <Aside/>
        </el-aside>
        <el-main :style="{backgroundImage: `url(${bgImg})`, backgroundSize: 'cover'}">
          <!-- <Artplayer/> -->
           <router-view v-slot="{ Component }">
              <transition>
                <keep-alive>
                  <component :is="Component" />
                </keep-alive>
              </transition>
            </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
 
 <style scoped lang="scss">
  .playerHeader{
      /* 核心代码：允许拖拽窗口 */
    -webkit-app-region: drag; 
    
    /* 解决交互冲突：禁止选中文本 */
    user-select: none;
    /* 允许拖拽整个 header 移动窗口 */
  }
  .el-main{
    padding: 0;
  }
 </style>
 
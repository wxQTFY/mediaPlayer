<script setup lang="ts">
  import { ref,onMounted,onUnmounted } from 'vue'
  import Artplayer from 'artplayer'
  import { defaultPlayerConf } from '@renderer/config/playerConf';
  // import videoUrl from '@renderer/assets/111.mp4'
  import { playM3u8, playFlv,playMpd} from './playLibraries'

  import artplayerPluginDashControl from 'artplayer-plugin-dash-control'
  import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';

  

  //props 传递数据
  const props = defineProps<{
    url: string;
  }>()
 //emit 传递方法
 // 1. 定义事件：告知父组件时长已更新
  const emit = defineEmits<{
    (e: 'get-duration', duration: number): void;
  }>();
  // console.log('ArtPlayer组件接收到的URL:', props.url);
  // let art: Artplayer | null = null
  const artRef = ref<HTMLDivElement | null>(null)
  // var player = shallowRef<Artplayer | null>(null)
  var art: Artplayer
  onMounted(() => {
    art = new Artplayer({
      container: artRef.value!, // 传入 DOM 元素或选择器
      url: props.url, // 视频 URL
      // type: props.url.includes('.mpd') ? 'mpd' : 'm3u8', // 视频类型
   
      customType:{
        mpd: playMpd,
        m3u8: playM3u8,
        flv: playFlv
      },
         plugins: [
          props.url.includes('.m3u8') ?  artplayerPluginHlsControl({
             quality: {
              control: true,
              setting: true,
              title: '画质',
              auto: '自动',
            }
          }): artplayerPluginDashControl({
            quality: {
              control: true,
              setting: true,
              title: '画质',
              auto: '自动',
            }
          })
       ],
      //  theme: '#29ADFF', 
      ...defaultPlayerConf
    })
    //视频快进
    art.on('ready', () => {
      art.forward=5; // 设置快进时间为 5 秒
      // console.log('播放器已准备好，当前视频URL:', props.url);
      //  console.info(art.duration);
       console.info(art.plugins.myPlugin)
      if(art && art.duration !== Infinity && art.duration > 0){
        emit('get-duration', art.duration);
      }
    });
    //  console.log('当前播放的url:', props.url);
    art.on('video:error', (err) => {
      console.error('视频渲染失败，请检查编码格式 (H.265?) 或路径', err);
    });
  })
  onUnmounted(() => {
  if (art) {
    // console.log('正在销毁播放器实例，释放资源...');
    art.destroy(true);
    // console.log('释放资源完毕');
  }
});
 
</script>

<template>
    <div ref="artRef" class="artplayer-app"></div>
</template>

<style lang="scss">
  .artplayer-app {
    // width: 1000px;
    // height: 600px;
    width: 100%;
    height: 100%;
    background-color: #000;
    // aspect-ratio: 16/9;
  }

</style>

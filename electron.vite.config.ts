// import { resolve } from 'path'
import { defineConfig, } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

const srcPath = path.resolve(__dirname, 'src')

import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        // 手动指定外部依赖，这是最稳妥的做法
        external: ['electron-store']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron-store']
      }
    }
  },
  renderer: {
    optimizeDeps: {
      // 关键：防止渲染进程预编译报错
      exclude: ['electron-store', 'ajv', 'ajv-formats']
    },
    resolve: {
      alias: {
        // 将 @renderer 映射到 src/renderer/src 目录
        '@renderer': path.resolve('src/renderer/src'),
        // 将 @common 映射到 src/common 目录
        '@common': path.resolve('src/common'),
      }
    },
    plugins: [
      vue(),
      tailwindcss(),
      AutoImport({
        resolvers: [
          ElementPlusResolver(),
           // 自动导入图标组件
          IconsResolver({
            prefix: 'Icon',
          }),
        ],
         dts:path.resolve(srcPath, 'renderer/auto-imports.d.ts')
      }),
      Components({
        resolvers: [
           // 自动注册图标组件
          IconsResolver({
            //设置图标组件的前缀，区别默认组件，默认为 'i'，如 <i-ep-full-screen />，使用前缀后为 <IconEpFullScreen />
            prefix: 'Icon',
            enabledCollections: ['ep','fluent','clarity'],
          }),

          ElementPlusResolver(),
        ],
        dts:path.resolve(srcPath, 'renderer/components.d.ts')
      }),
      Icons({
        autoInstall: true,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:9999',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '') //// 移除路径中的 /api 前缀
        },
        // 如果有 HLS 视频流或静态资源
        '/temp_hls': {
          target: 'http://localhost:9999',
          changeOrigin: true
        }
      }
    }
  },
})

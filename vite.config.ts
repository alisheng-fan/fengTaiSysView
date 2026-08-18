import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      AutoImport({ imports: ['vue', 'vue-router', 'pinia'] }),
      Components({ resolvers: [ElementPlusResolver()] }),
      viteMockServe({ mockPath: 'mock', enable: env.VITE_USE_MOCK === 'true' }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy: {
        // 切真实后端时启用：'/api' → 后端地址
        // '/api': { target: 'http://your-backend', changeOrigin: true },
      },
    },
  }
})

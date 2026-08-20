/**
 * 应用入口：创建 Vue 实例并挂载
 * - 注册 Pinia 状态管理、Vue Router 路由、v-perm 权限指令
 * - 全局注册 Element Plus 图标组件，引入 Element Plus 与项目全局样式
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElMessage } from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import { setNotifyError } from '@/api/request'
import App from './App.vue'
import router from './router'
import { perm } from '@/directives/perm'
import './styles/index.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.directive('perm', perm)

// 全局注册 Element Plus 图标（模板中可按图标组件名直接引用，如 <component :is="...">）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

// 注入错误消息提示：shared 层通过 setNotifyError 回调各端实现（PC=ElMessage.error）
setNotifyError((msg) => ElMessage.error(msg))

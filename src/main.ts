import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles/index.scss'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')

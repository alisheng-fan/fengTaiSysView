import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import { showToast } from 'vant'
import { setNotifyError } from '@shared/api/request'
import App from './App.vue'
import router from './router'
import './styles/index.scss'

setNotifyError((msg) => showToast(msg))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
app.mount('#app')

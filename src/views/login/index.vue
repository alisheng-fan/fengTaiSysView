<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// import.meta 不能直接出现在模板插值中（Vue 模板表达式解析器不支持），
// 需在 script 中取值后再引用。见 task-7 报告。
const appTitle = import.meta.env.VITE_APP_TITLE

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch {
    // 错误提示已由请求层统一处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">{{ appTitle }}</h2>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">演示账号：admin / admin123（全权限），user / user123（部分权限）</div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #1f3a5f, #409eff);
}
.login-card {
  width: 380px;
  padding: 40px 36px 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 30px rgb(0 0 0 / 20%);
}
.login-title {
  margin-bottom: 24px;
  text-align: center;
  font-size: 22px;
  color: #1f3a5f;
}
.login-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>

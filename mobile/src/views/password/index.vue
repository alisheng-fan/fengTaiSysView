<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { changePassword } from '@shared/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

/** 修改密码：校验后提交，成功清 token 跳登录 */
async function submit() {
  if (!form.oldPassword || !form.newPassword) {
    showToast('请填写完整')
    return
  }
  if (form.newPassword.length < 6) {
    showToast('新密码至少 6 位')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    showToast('两次输入不一致')
    return
  }
  submitting.value = true
  try {
    await changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    showSuccessToast('修改成功，请重新登录')
    userStore.logout()
    router.replace('/login')
  } catch {
    // 错误已提示
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="password-page">
    <van-nav-bar title="修改密码" left-arrow @click-left="router.back()" />
    <van-form @submit="submit">
      <van-cell-group inset>
        <van-field v-model="form.oldPassword" type="password" label="原密码" placeholder="请输入原密码" />
        <van-field v-model="form.newPassword" type="password" label="新密码" placeholder="至少 6 位" />
        <van-field v-model="form.confirmPassword" type="password" label="确认新密码" placeholder="再次输入" />
      </van-cell-group>
      <div style="margin: 16px">
        <van-button round block type="primary" native-type="submit" :loading="submitting">确认修改</van-button>
      </div>
    </van-form>
  </div>
</template>

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from '@/types'
import { getToken, removeToken } from '@/utils/auth'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

/** 请求拦截器：注入 token（纯函数，可单测） */
export function injectToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/** 响应拦截器：统一校验业务码（纯函数，可单测） */
export function normalizeResponse(response: AxiosResponse): AxiosResponse {
  const res = response.data as ApiResult
  if (res.code !== 0) {
    ElMessage.error(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return response
}

/** 响应错误处理：401 清除凭证跳登录（纯函数，可单测） */
export function handleHttpError(error: AxiosError<ApiResult>): Promise<never> {
  if (error.response?.status === 401) {
    removeToken()
    ElMessage.error('登录已过期，请重新登录')
    window.location.href = '/login'
  } else {
    ElMessage.error(error.response?.data?.message || error.message || '网络错误')
  }
  return Promise.reject(error)
}

service.interceptors.request.use(injectToken)
service.interceptors.response.use(normalizeResponse, handleHttpError)

/** 统一请求入口：泛型 T 为后端 data 字段类型 */
export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config).then((res) => res.data.data as T)
}

export default service

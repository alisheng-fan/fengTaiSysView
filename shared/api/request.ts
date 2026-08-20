/**
 * Axios 封装：统一请求/响应处理
 * - 请求前注入 token（Authorization: Bearer xxx）
 * - 响应统一校验业务码 code（非 0 视为业务失败并弹错误提示）
 * - 401 清除本地凭证并跳转登录页
 * - request<T> 收窄返回类型，直接返回后端 data 字段
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResult } from '../types'
import { getToken, removeToken } from '../utils/auth'

/** 错误消息提示：由各端注入（PC=ElMessage.error，移动=Vant showToast） */
export let notifyError: (msg: string) => void = (msg) => console.error(msg)

/** 注入错误消息提示实现（在应用入口调用） */
export function setNotifyError(fn: (msg: string) => void): void {
  notifyError = fn
}

/** axios 实例：baseURL 取环境变量 VITE_API_BASE_URL，超时 15s */
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
    notifyError(res.message || '请求失败')
    throw new Error(res.message || '请求失败')
  }
  return response
}

/** 响应错误处理：401 清除凭证跳登录（纯函数，可单测） */
export function handleHttpError(error: AxiosError<ApiResult>): Promise<never> {
  if (error.response?.status === 401) {
    removeToken()
    notifyError('登录已过期，请重新登录')
    window.location.href = '/login'
  } else {
    notifyError(error.response?.data?.message || error.message || '网络错误')
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

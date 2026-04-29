import Taro from '@tarojs/taro'
import { storage } from './storage'
import type { ApiResponse } from '../types/api'
import { BASE_URL } from '../config'

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needToken?: boolean
}

class Request {
  private async getHeaders(needToken: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (needToken) {
      const token = await storage.getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const { url, method = 'GET', data, header = {}, needToken = true } = config

    try {
      const headers = await this.getHeaders(needToken)
      const finalHeaders = { ...headers, ...header }

      const response = await Taro.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: finalHeaders,
        timeout: 10000
      })

      const result = response.data as ApiResponse<T>

      if (result.code === 401) {
        await storage.clearAll()
        Taro.reLaunch({ url: '/pages/index/index' })
        throw new Error('登录已过期，请重新登录')
      }

      if (result.code !== 200) {
        throw new Error(result.message || '请求失败')
      }

      return result
    } catch (error: any) {
      console.error('请求错误:', error)
      
      if (error.errMsg && error.errMsg.includes('request:fail')) {
        Taro.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
      }
      
      throw error
    }
  }

  get<T = any>(url: string, data?: any, needToken: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', data, needToken })
  }

  post<T = any>(url: string, data?: any, needToken: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, needToken })
  }

  put<T = any>(url: string, data?: any, needToken: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, needToken })
  }

  delete<T = any>(url: string, data?: any, needToken: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', data, needToken })
  }
}

const request = new Request()

export default request

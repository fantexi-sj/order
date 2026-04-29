import Taro from '@tarojs/taro'
import { storage } from './storage'
import type { LoginResponse } from '../types/api'
import { userApi } from '../api/user'

export const auth = {
  login: async (): Promise<LoginResponse> => {
    try {
      const loginRes = await Taro.login()
      
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      const response = await userApi.login(loginRes.code)

      const { token, user } = response.data

      await storage.setToken(token)
      await storage.setUserInfo(user)

      return response.data
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  logout: async (): Promise<void> => {
    try {
      await storage.clearAll()
      
      Taro.showToast({
        title: '已退出登录',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/index/index' })
      }, 1500)
    } catch (error) {
      console.error('退出登录失败:', error)
      throw error
    }
  },

  checkLogin: async (): Promise<boolean> => {
    const token = await storage.getToken()
    return !!token
  },

  getToken: async (): Promise<string | null> => {
    return await storage.getToken()
  }
}

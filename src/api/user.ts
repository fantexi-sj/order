import Taro from '@tarojs/taro'
import request from '../utils/request'
import type { 
  LoginRequest, 
  LoginResponse, 
  UpdateUserInfoRequest, 
  UserInfoResponse 
} from '../types/api'
import { BASE_URL } from '../config'

const MERCHANT_ID = 1

export const userApi = {
  login: (code: string) => {
    return request.post<LoginResponse>('/user/wx-login', {
      code,
      merchant_id: MERCHANT_ID
    }, false)
  },

  getUserInfo: () => {
    return request.get<UserInfoResponse>('/user/info')
  },

  updateUserInfo: (data: UpdateUserInfoRequest) => {
    return request.put<UserInfoResponse>('/user/update', data)
  },

  uploadAvatar: (filePath: string) => {
    return new Promise<string>((resolve, reject) => {
      const token = Taro.getStorageSync('token')
      
      Taro.uploadFile({
        url: `${BASE_URL}/upload/avatar`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          try {
            if (res.statusCode === 200) {
              const data = JSON.parse(res.data)
              if (data.code === 200 && data.data?.url) {
                resolve(data.data.url)
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } else {
              reject(new Error(`上传失败，状态码：${res.statusCode}`))
            }
          } catch (error) {
            reject(new Error('服务器返回数据格式错误'))
          }
        },
        fail: (error) => {
          reject(new Error(error.errMsg || '网络请求失败'))
        }
      })
    })
  }
}

import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { auth } from '../../utils/auth'
import useUserStore from '../../store/user'

import './index.scss'

function Login() {
  const [loading, setLoading] = useState(false)
  const { setUserInfo } = useUserStore()

  const handleLogin = async () => {
    if (loading) return
    
    try {
      setLoading(true)
      
      Taro.showLoading({ title: '登录中...' })
      
      const loginRes = await auth.login()
      
      setUserInfo({
        id: loginRes.user.id,
        name: loginRes.user.name,
        gender: loginRes.user.gender,
        avatarUrl: loginRes.user.avatar_url,
        birthday: loginRes.user.birthday.split('T')[0]
      })
      
      Taro.hideLoading()
      
      Taro.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      
    } catch (error: any) {
      Taro.hideLoading()
      
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-container'>
        <View className='login-header'>
          <Text className='login-title'>欢迎登录</Text>
          <Text className='login-desc'>登录后即可享受完整服务</Text>
        </View>
        
        <Button 
          className='login-btn' 
          onClick={handleLogin}
          loading={loading}
          disabled={loading}
        >
          微信一键登录
        </Button>
        
        <Text className='login-tip'>
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}

export default Login

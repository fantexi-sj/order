import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { auth } from '../../utils/auth'
import useUserStore from '../../store/user'
import { userApi } from '../../api/user'

import './login-modal.scss'

interface LoginModalProps {
  visible: boolean
  onClose: () => void
}

function LoginModal({ visible, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const { setUserInfo } = useUserStore()

  const handleChooseAvatar = (e: any) => {
    const { avatarUrl } = e.detail
    setAvatarUrl(avatarUrl)
  }

  const handleNicknameInput = (e: any) => {
    setNickname(e.detail.value)
  }

  const handleLogin = async () => {
    if (loading) return

    if (!nickname.trim()) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      Taro.showLoading({ title: '登录中...' })

      const loginRes = await auth.login()

      let finalAvatarUrl = loginRes.user.avatar_url || ''

      if (avatarUrl) {
        const isLocalFile = avatarUrl.startsWith('http://tmp/') || 
                            avatarUrl.startsWith('wxfile://') ||
                            avatarUrl.startsWith('http://tmp')
        
        if (isLocalFile) {
          finalAvatarUrl = await userApi.uploadAvatar(avatarUrl)
        } else {
          finalAvatarUrl = avatarUrl
        }
      }

      await userApi.updateUserInfo({
        name: nickname,
        gender: loginRes.user.gender || 'male',
        avatar_url: finalAvatarUrl,
        birthday: loginRes.user.birthday ? loginRes.user.birthday.split('T')[0] : '2000-01-01'
      })

      setUserInfo({
        id: loginRes.user.id,
        name: nickname,
        gender: loginRes.user.gender || 'male',
        avatarUrl: finalAvatarUrl || '/assets/tabbar/user.png',
        birthday: loginRes.user.birthday ? loginRes.user.birthday.split('T')[0] : '2000-01-01'
      })

      Taro.hideLoading()
      Taro.showToast({
        title: '登录成功',
        icon: 'success'
      })

      setTimeout(() => {
        onClose()
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

  if (!visible) return null

  return (
    <View className='login-modal-mask' catchMove onClick={onClose}>
      <View className='login-modal' onClick={(e) => e.stopPropagation()}>
        <View className='modal-header'>
          <Text className='modal-title'>欢迎登录</Text>
          <Text className='modal-desc'>完善信息以获得更好体验</Text>
        </View>

        <View className='modal-content'>
          <View className='avatar-section'>
            <Button 
              className='avatar-btn' 
              open-type='chooseAvatar' 
              onChooseAvatar={handleChooseAvatar}
            >
              <Image 
                className='avatar-image' 
                src={avatarUrl || '/assets/tabbar/user.png'} 
                mode='aspectFill' 
              />
              <Text className='avatar-tip'>点击选择头像</Text>
            </Button>
          </View>

          <View className='nickname-section'>
            <Input
              className='nickname-input'
              type='nickname'
              placeholder='请输入昵称'
              placeholderClass='placeholder-style'
              value={nickname}
              onInput={handleNicknameInput}
            />
          </View>
        </View>

        <View className='modal-footer'>
          <Button 
            className='login-btn' 
            onClick={handleLogin}
            loading={loading}
            disabled={loading}
          >
            立即登录
          </Button>
          <Text className='login-tip'>
            登录即代表同意《用户协议》和《隐私政策》
          </Text>
        </View>
      </View>
    </View>
  )
}

export default LoginModal

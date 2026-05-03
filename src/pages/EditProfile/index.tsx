import { View, Text, Image, Input, Picker, Radio, RadioGroup } from '@tarojs/components'
import Taro, { chooseImage, getUserProfile } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import useUserStore from '../../store/user'
import { userApi } from '../../api/user'
import { auth } from '../../utils/auth'

import './index.scss'

function EditProfile() {
  const { userInfo, setUserInfo, isLoggedIn } = useUserStore()
  const [nickname, setNickname] = useState(userInfo.name)
  const [gender, setGender] = useState(userInfo.gender || 'male')
  const [birthday, setBirthday] = useState(userInfo.birthday || '2000-01-01')
  const [avatarUrl, setAvatarUrl] = useState(userInfo.avatarUrl || '/assets/tabbar/user.png')
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showNicknameButton, setShowNicknameButton] = useState(false)
  const [wechatAvatarUrl, setWechatAvatarUrl] = useState('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    try {
      const res = await userApi.getUserInfo()
      const userData = res.data
      setNickname(userData.name)
      setGender(userData.gender || 'male')
      const birthdayValue = userData.birthday ? userData.birthday.split('T')[0] : '2000-01-01'
      setBirthday(birthdayValue)
      setAvatarUrl(userData.avatar_url || '/assets/tabbar/user.png')
      
      setUserInfo({
        id: userData.id,
        name: userData.name,
        gender: userData.gender,
        avatarUrl: userData.avatar_url,
        birthday: birthdayValue
      })
    } catch (error) {
      console.error('获取用户信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyboardHeight = (res) => {
      setKeyboardHeight(res.height)
    }
    
    Taro.onKeyboardHeightChange(handleKeyboardHeight)
    
    return () => {
      Taro.offKeyboardHeightChange(handleKeyboardHeight)
    }
  }, [])

  const handleAvatarClick = () => {
    setShowActionSheet(true)
    getUserProfile({
      desc: '用于获取微信头像预览'
    }).then(res => {
      if (res.userInfo?.avatarUrl) {
        setWechatAvatarUrl(res.userInfo.avatarUrl)
      }
    }).catch(err => {
      console.error('获取微信头像失败', err)
    })
  }

  const handleChooseFromAlbum = async () => {
    setShowActionSheet(false)
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album']
      })
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setAvatarUrl(res.tempFilePaths[0])
      }
    } catch (error) {
      console.error('选择图片失败', error)
    }
  }

  const handleTakePhoto = async () => {
    setShowActionSheet(false)
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera']
      })
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setAvatarUrl(res.tempFilePaths[0])
      }
    } catch (error) {
      console.error('拍照失败', error)
    }
  }

  const handleUseWechatAvatar = () => {
    if (wechatAvatarUrl) {
      setAvatarUrl(wechatAvatarUrl)
      setShowActionSheet(false)
    }
  }

  const handleCancel = () => {
    setShowActionSheet(false)
  }

  const handleNicknameFocus = () => {
    setShowNicknameButton(true)
  }

  const handleNicknameBlur = () => {
    setTimeout(() => {
      setShowNicknameButton(false)
    }, 200)
  }

  const handleGetWechatNickname = () => {
    getUserProfile({
      desc: '用于获取微信昵称'
    }).then(res => {
      if (res.userInfo?.nickName) {
        setNickname(res.userInfo.nickName)
      }
    }).catch(err => {
      console.error('获取微信昵称失败', err)
    })
  }

  const handleGenderChange = (e) => {
    setGender(e.detail.value)
  }

  const handleBirthdayChange = (e) => {
    setBirthday(e.detail.value)
  }

  const handleSave = async () => {
    if (saving) return
    
    if (!nickname.trim()) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }
    
    setSaving(true)
    Taro.showLoading({ title: '保存中...' })
    
    try {
      let finalAvatarUrl = avatarUrl || ''
      
      if (finalAvatarUrl) {
        const isLocalFile = finalAvatarUrl.startsWith('http://tmp/') || 
                            finalAvatarUrl.startsWith('wxfile://') ||
                            finalAvatarUrl.startsWith('http://tmp')
        
        if (isLocalFile) {
          finalAvatarUrl = await userApi.uploadAvatar(finalAvatarUrl)
        }
      }

      const finalBirthday = birthday || '2000-01-01'
      
      if (!isLoggedIn) {
        const loginRes = await auth.login()
        
        await userApi.updateUserInfo({
          name: nickname,
          gender: gender,
          avatar_url: finalAvatarUrl,
          birthday: finalBirthday
        })
        
        setUserInfo({
          id: loginRes.user.id,
          name: nickname,
          gender: gender,
          avatarUrl: finalAvatarUrl || '/assets/tabbar/user.png',
          birthday: finalBirthday
        })
      } else {
        await userApi.updateUserInfo({
          name: nickname,
          gender: gender,
          avatar_url: finalAvatarUrl,
          birthday: finalBirthday
        })
        
        setUserInfo({
          id: userInfo.id,
          name: nickname,
          gender: gender,
          avatarUrl: finalAvatarUrl,
          birthday: finalBirthday
        })
      }
      
      Taro.hideLoading()
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
      Taro.navigateBack()
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View className='edit-profile-page'>
      <View className='avatar-section' onClick={handleAvatarClick}>
        <Image className='avatar-image' src={avatarUrl} mode='aspectFill' />
      </View>

      <View className='form-section'>
        <View className='form-item'>
          <Text className='form-label'>昵称</Text>
          <Input
            className='form-input'
            value={nickname}
            placeholder='请输入昵称'
            placeholderClass='placeholder-style'
            adjustPosition
            onInput={(e) => setNickname(e.detail.value)}
            onFocus={handleNicknameFocus}
            onBlur={handleNicknameBlur}
          />
        </View>

        <View className='form-item'>
          <Text className='form-label'>性别</Text>
          <RadioGroup className='gender-group' onChange={handleGenderChange}>
            <Radio
              className='radio-item'
              value='male'
              checked={gender === 'male'}
            >
              男
            </Radio>
            <Radio
              className='radio-item'
              value='female'
              checked={gender === 'female'}
            >
              女
            </Radio>
          </RadioGroup>
        </View>

        <View className='form-item'>
          <Text className='form-label'>生日</Text>
          <View className='birthday-picker'>
            <Picker mode='date' value={birthday} onChange={handleBirthdayChange}>
              <View className='picker-display'>
                {birthday || '请选择您的出生日期'}
                {birthday && (
                  <Text className='clear-btn' onClick={(e) => {
                    e.stopPropagation()
                    setBirthday('')
                  }}>✕</Text>
                )}
              </View>
            </Picker>
          </View>
        </View>
      </View>

      <View className={`save-btn ${saving ? 'disabled' : ''}`} onClick={handleSave}>
        <Text className='save-text'>{saving ? '保存中...' : '保存'}</Text>
      </View>

      {showNicknameButton && (
        <View className='nickname-button-wrapper' style={{ bottom: `${keyboardHeight}px` }}>
          <View className='nickname-button' onClick={handleGetWechatNickname}>
            使用微信昵称
          </View>
        </View>
      )}

      {showActionSheet && (
        <View className='action-sheet-mask' onClick={handleCancel}>
          <View className='action-sheet'>
            <View className='action-item wechat-action' onClick={handleUseWechatAvatar}>
              <View className='wechat-avatar-wrapper'>
                <Text className='wechat-action-text'>使用微信头像</Text>
                {wechatAvatarUrl && (
                  <Image className='wechat-avatar-preview' src={wechatAvatarUrl} mode='aspectFill' />
                )}
              </View>
            </View>
            <View className='action-item' onClick={handleChooseFromAlbum}>
              从相册选择
            </View>
            <View className='action-item' onClick={handleTakePhoto}>
              拍照
            </View>
            <View className='action-item cancel-item' onClick={handleCancel}>
              取消
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default EditProfile

import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import useUserStore from '../../store/user'
import useShopStore from '../../store/shop'
import { auth } from '../../utils/auth'
import { storage } from '../../utils/storage'
import { pageCache } from '../../utils/cache'
import { merchantApi } from '../../api/merchant'
import { userApi } from '../../api/user'
import LoginModal from '../../components/LoginModal'

import './index.scss'

function Index() {
  const { userInfo, isLoggedIn, initUserInfo } = useUserStore()
  const { setShopInfo, getShopName, getBusinessHours, getShopAddress } = useShopStore()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    checkLoginStatus()
    fetchMerchantInfo()
  }, [])

  const fetchMerchantInfo = async () => {
    const cached = pageCache.get<Parameters<typeof setShopInfo>[0]>('merchant_info')
    if (cached) {
      setShopInfo(cached)
    }

    try {
      const res = await merchantApi.getMerchantInfo()
      if (pageCache.isDifferent('merchant_info', res.data)) {
        setShopInfo(res.data)
        pageCache.set('merchant_info', res.data)
      }
    } catch (error) {
      console.log('获取商家信息失败:', error)
    }
  }

  const checkLoginStatus = async () => {
    const token = await storage.getToken()
    
    if (token) {
      try {
        const res = await userApi.getUserInfo()
        const userData = res.data
        
        initUserInfo({
          id: userData.id,
          name: userData.name,
          gender: userData.gender,
          avatarUrl: userData.avatar_url,
          birthday: userData.birthday ? userData.birthday.split('T')[0] : '2000-01-01'
        })
      } catch (error) {
        console.error('Token 验证失败:', error)
        await storage.clearAll()
        setTimeout(() => {
          setShowLoginModal(true)
        }, 500)
      }
    } else {
      setTimeout(() => {
        setShowLoginModal(true)
      }, 500)
    }
  }

  const handleCloseLoginModal = () => {
    setShowLoginModal(false)
  }

  /**
   * 堂食点单 - 扫描座位二维码
   */
  const handleDineIn = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    try {
      await storage.setOrderType('dine_in')
      const res = await Taro.scanCode({
        scanType: ['qrCode']
      })
      console.log('扫码结果:', res.result)
      Taro.switchTab({ url: '/pages/BrowseMenuList/index' })
    } catch (error) {
      console.log('扫码取消或失败:', error)
    }
  }

  /**
   * 跳转到店自取页面
   */
  const handleTakeout = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    await storage.setOrderType('takeaway')
    Taro.switchTab({ url: '/pages/BrowseMenuList/index' })
  }

  /**
   * 打开路线导航
   */
  const handleNavigation = () => {
    console.log('路线导航')
  }


  /**
   * 跳转到编辑个人资料页面
   */
  const handleEditProfile = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    Taro.navigateTo({ url: '/pages/EditProfile/index' })
  }

  return (
    <View className='home-page'>
      {/* 顶部欢迎区域 - 完整店铺场景 */}
      <View className='header-section'>
        {/* 云朵装饰 */}
        <View className='cloud cloud-left-1'></View>
        <View className='cloud cloud-left-2'></View>
        <View className='cloud cloud-right'></View>
        
        {/* 左侧树木 */}
        <View className='tree tree-small-left-1'></View>
        <View className='tree tree-medium-left-1'></View>
        <View className='tree tree-tall-left-1'></View>
        <View className='tree tree-tall-left-2'></View>
        <View className='tree tree-medium-left-2'></View>
        
        {/* 右侧树木 */}
        <View className='tree tree-right-large'></View>

        {/* 店铺建筑主体 */}
        <View className='shop-container'>
          {/* WELCOME 横幅 */}
          <View className='welcome-banner'>
            <Text className='welcome-text'>WELCOME</Text>
          </View>
          
          {/* 店铺建筑 */}
          <View className='shop-building'>
            {/* 建筑主体 */}
            <View className='building-main'>
              {/* 左侧窗户区域（带遮阳篷）*/}
              <View className='window-area'>
                <View className='awning-stripes'>
                  <View className='stripe stripe-1'></View>
                  <View className='stripe stripe-2'></View>
                  <View className='stripe stripe-3'></View>
                  <View className='stripe stripe-4'></View>
                  <View className='stripe stripe-5'></View>
                </View>
                <View className='window-frame'>
                  <View className='window-inner'>
                    <View className='bowl-on-counter'>
                      <View className='bowl-body'></View>
                      <View className='food-in-bowl'></View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* 右侧门 */}
              <View className='door-area'>
                <View className='door-frame'>
                  <View className='door-glass'></View>
                  <View className='door-handle'></View>
                </View>
              </View>
              
              {/* 柜台/台面 */}
              <View className='counter-top'></View>
            </View>
            
            {/* 底部装饰 */}
            <View className='building-base'></View>
          </View>
        </View>
        
        {/* 地面装饰 */}
        <View className='ground-decoration'></View>
      </View>

      {/* 用户信息卡片 */}
      <View className='user-card' onClick={handleEditProfile}>
        <View className='avatar-wrapper'>
          <Image
            className='avatar'
            src={userInfo.avatarUrl || '/assets/tabbar/user.png'}
            mode='aspectFill'
            onError={() => {}}
          />
        </View>
        <Text className='nickname'>{userInfo.name || '游客'}</Text>
      </View>

      {/* 功能区域 */}
      <View className='function-section'>
        {/* 堂食点单 */}
        <View className='function-card' onClick={handleDineIn}>
          <Text className='function-title'>堂食点单</Text>
          <Text className='function-desc'>自主下单，方便快捷</Text>
          <View className='function-icon dine-in-icon'>
            <View className='shop-building-icon'>
              <View className='icon-roof'></View>
              <View className='icon-body'>
                <View className='icon-door'></View>
                <View className='icon-window'></View>
              </View>
              <View className='icon-awning'></View>
            </View>
          </View>
        </View>

        {/* 到店自取 */}
        <View className='function-card' onClick={handleTakeout}>
          <Text className='function-title'>到店自取</Text>
          <Text className='function-desc'>提前下单，到店免排队</Text>
          <View className='function-icon takeout-icon'>
            <View className='shopping-bag'>
              <View className='bag-handle'></View>
              <View className='bag-body'>
                <View className='bag-stripes'></View>
              </View>
              <View className='heart-icon'>♥</View>
            </View>
          </View>
        </View>
      </View>
      {/* 商家信息 */}
      <View className='merchant-section'>
        <View className='merchant-card'>
          <View>
            <View className='merchant-header'>
            <Text className='merchant-name'>{getShopName()}</Text>
          </View>
          <View className='merchant-info'>
            <Text className='info-text'>营业时间：{getBusinessHours()}</Text>
          </View>
          <View className='merchant-info'>
            <Text className='info-text'>地址：{getShopAddress()}</Text>  
          </View>
        </View>
        <View className='nav-btn' onClick={handleNavigation}>
          <View className='location-icon'>📍</View>
          <Text className='nav-text'>路线</Text>
        </View>
        </View>
        
      </View>

      <LoginModal visible={showLoginModal} onClose={handleCloseLoginModal} />
    </View>
  )
}

export default Index

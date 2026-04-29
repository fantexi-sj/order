import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import useUserStore from '../../store/user'

import './index.scss'

function CheckOrderStatus() {
  const { getUserName, getUserAvatar } = useUserStore()

  const handleServiceClick = (type: string) => {
    console.log('点击服务:', type)
    switch (type) {
      case 'gift':
        Taro.showToast({ title: '储值有礼', icon: 'none' })
        break
      case 'address':
        Taro.showToast({ title: '我的地址', icon: 'none' })
        break
      case 'privacy':
        Taro.showToast({ title: '隐私政策', icon: 'none' })
        break
      case 'contact':
        Taro.showToast({ title: '联系商家', icon: 'none' })
        break
      case 'language':
        Taro.showToast({ title: '切换语言', icon: 'none' })
        break
      case 'storage':
        Taro.showToast({ title: '我的寄存', icon: 'none' })
        break
      default:
        break
    }
  }

  return (
    <View className='check-order-status'>
      {/* 用户信息区域 */}
      <View className='user-section'>
        <Text className='user-name'>{getUserName()}</Text>
        <Image className='user-avatar' src={getUserAvatar()} mode='aspectFill' />
      </View>

      {/* 注册/登录会员横幅 */}
      <View className='member-banner'>
        <View className='banner-left'>
          <Text className='banner-icon'>💎</Text>
          <Text className='banner-text'>注册/登录会员,享更多专属权益</Text>
        </View>
        <View className='banner-right'>
          <Text className='banner-btn-text'>领取优惠</Text>
          <Text className='banner-arrow'>→</Text>
        </View>
      </View>

      {/* 数据统计区域 */}
      <View className='stats-card'>
        <View className='stat-item'>
          <Text className='stat-value'>¥0</Text>
          <Text className='stat-label'>余额</Text>
        </View>
        <View className='stat-item stat-disabled'>
          <Text className='stat-label stat-placeholder'>敬请期待</Text>
          <Text className='stat-label'>积分详情</Text>
        </View>
        <View className='stat-item'>
          <Text className='stat-value'>0</Text>
          <Text className='stat-label'>优惠券</Text>
        </View>
        <View className='stat-item'>
          <View className='qrcode-icon'>
            <View className='qr-code'></View>
          </View>
          <Text className='stat-label'>会员码</Text>
        </View>
      </View>

      {/* 广告横幅 */}
      <View className='ad-banner'>
        <View className='ad-content'>
          <View className='ad-left'>
            <Text className='ad-title'>鲜</Text>
            <View className='ad-subtitle'>
              <Text className='ad-en'>More than the taste</Text>
              <Text className='ad-cn'>不止于滋味</Text>
            </View>
            <Text className='ad-slogan'>唯有美食 不可辜负</Text>
          </View>
          <View className='ad-right'>
            <View className='food-image-wrapper'>
              <Image
                className='food-image'
                src='https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&h=300&fit=crop'
                mode='aspectFill'
              />
            </View>
          </View>
        </View>
      </View>

      {/* 服务中心 */}
      <View className='service-section'>
        <Text className='service-title'>服务中心</Text>
        <View className='service-grid'>
          <View className='service-item' onClick={() => handleServiceClick('gift')}>
            <View className='service-icon gift-icon'>
              <View className='gift-box'>
                <View className='gift-lid'></View>
                <View className='gift-body'></View>
                <View className='gift-ribbon'></View>
              </View>
            </View>
            <Text className='service-label'>储值有礼</Text>
          </View>

          <View className='service-item' onClick={() => handleServiceClick('address')}>
            <View className='service-icon location-icon'>
              <View className='location-pin'>
                <View className='pin-head'></View>
                <View className='pin-shadow'></View>
              </View>
            </View>
            <Text className='service-label'>我的地址</Text>
          </View>

          <View className='service-item' onClick={() => handleServiceClick('privacy')}>
            <View className='service-icon privacy-icon'>
              <View className='document'>
                <View className='doc-lines'>
                  <View className='doc-line'></View>
                  <View className='doc-line'></View>
                  <View className='doc-line short'></View>
                </View>
              </View>
            </View>
            <Text className='service-label'>隐私政策</Text>
          </View>

          <View className='service-item' onClick={() => handleServiceClick('contact')}>
            <View className='service-icon phone-icon'>
              <View className='phone'>
                <View className='phone-body'></View>
                <View className='phone-screen'></View>
              </View>
            </View>
            <Text className='service-label'>联系商家</Text>
          </View>

          <View className='service-item' onClick={() => handleServiceClick('language')}>
            <View className='service-icon language-icon'>
              <View className='globe'>
                <View className='globe-circle'></View>
                <View className='globe-meridian'></View>
                <View className='globe-equator'></View>
              </View>
            </View>
            <Text className='service-label'>切换语言</Text>
          </View>

          <View className='service-item' onClick={() => handleServiceClick('storage')}>
            <View className='service-icon storage-icon'>
              <View className='wine-glass'>
                <View className='glass-body'></View>
                <View className='glass-stem'></View>
                <View className='glass-base'></View>
              </View>
            </View>
            <Text className='service-label'>我的寄存</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default CheckOrderStatus

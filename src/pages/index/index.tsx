import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'

import './index.scss'

function Index() {
  const handleDineIn = () => {
    console.log('堂食点单')
  }

  const handleTakeout = () => {
    console.log('到店自取')
  }

  const handleNavigation = () => {
    console.log('路线导航')
  }

 const UesrList = [
  {
    id: 1,
    name: '范特西',
    gender: 'male',
    avatarUrl: 'https://img.3dmgame.com/uploads/images/news/20190120/1547978611_651168.jpg',
    birthday: '2000-01-01',
  },
 ]

 const shopList = [
  {
    id: 1,
    shopname: '蛙大大牛蛙',
    BusinessHours: '09:00 - 22:00',
    address: '广东省东莞市麻涌镇 蛙大大牛蛙',
  },
 ]


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
      <View className='user-card'>
        <View className='avatar-wrapper'>
          <Image
            className='avatar'
            src={UesrList[0]?.avatarUrl || '/assets/tabbar/user.png'}
            mode='aspectFill'
            onError={() => {}}
          />
        </View>
        <Text className='nickname'>{UesrList[0]?.name || '游客'}</Text>
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
            <Text className='merchant-name'>{shopList[0]?.shopname || '店铺商家'}</Text>
          </View>
          <View className='merchant-info'>
            <Text className='info-text'>营业时间：{shopList[0]?.BusinessHours || '暂未营业'}</Text>
          </View>
          <View className='merchant-info'>
            <Text className='info-text'>地址：{shopList[0]?.address ||'暂无地址'}</Text>  
          </View>
        </View>
        <View className='nav-btn' onClick={handleNavigation}>
          <View className='location-icon'>📍</View>
          <Text className='nav-text'>路线</Text>
        </View>
        </View>
        
      </View>
    </View>
  )
}

export default Index

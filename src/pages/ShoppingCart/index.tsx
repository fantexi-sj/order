import { View, Text } from '@tarojs/components'
import { useState } from 'react'

import './index.scss'

type TabType = 'all' | 'activity'

function ShoppingCart() {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  return (
    <View className='shopping-cart'>
      <View className='tab-container'>
        <View
          className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <Text className='tab-text'>全部</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          <Text className='tab-text'>活动订单</Text>
        </View>
      </View>

      <View className='order-content'>
        <View className='empty-state'>
          <View className='empty-icon-wrapper'>
            <View className='document-icon'>
              <View className='doc-body'></View>
              <View className='doc-line doc-line-1'></View>
              <View className='doc-line doc-line-2'></View>
              <View className='doc-line doc-line-3'></View>
              <View className='search-circle'></View>
              <View className='search-handle'></View>
            </View>
          </View>
          <Text className='empty-text'>暂无订单记录</Text>
        </View>
      </View>
    </View>
  )
}

export default ShoppingCart

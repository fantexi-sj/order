import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import useShopStore from '../../store/shop'
import useOrderStore from '../../store/order'
import { orderApi } from '../../api/order'
import { cartApi } from '../../api/cart'
import { storage } from '../../utils/storage'
import type { Order } from '../../types/order'
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from '../../types/order'

import './index.scss'

const MAX_VISIBLE_ITEMS = 3

function OrderDetail() {
  const router = useRouter()
  const { getShopName } = useShopStore()
  const { updateOrderInList } = useOrderStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllItems, setShowAllItems] = useState(false)

  useDidShow(() => {
    const orderId = router.params.id
    if (orderId) {
      fetchOrderDetail(Number(orderId))
    }
  })

  const fetchOrderDetail = async (orderId: number) => {
    setLoading(true)
    try {
      const res = await orderApi.getOrderDetail(orderId)
      if (res.code === 200) {
        setOrder(res.data)
      }
    } catch (error) {
      console.error('获取订单详情失败:', error)
      Taro.showToast({ title: '获取订单详情失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    try {
      Taro.showLoading({ title: '取消中...' })
      const res = await orderApi.cancelOrder(order.id)
      Taro.hideLoading()

      if (res.code === 200) {
        const updatedOrder = {
          ...order,
          status: 2 as const,
          status_text: '已取消',
          cancel_time: new Date().toISOString()
        }
        setOrder(updatedOrder)
        updateOrderInList(order.id, {
          status: 2,
          status_text: '已取消'
        })
        Taro.showToast({ title: '订单已取消', icon: 'success' })
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '取消失败', icon: 'none' })
    }
  }

  const handlePayOrder = async () => {
    if (!order) return

    try {
      Taro.showLoading({ title: '支付中...' })
      const res = await orderApi.payOrder(order.id)
      Taro.hideLoading()

      if (res.code === 200) {
        const updatedOrder = {
          ...order,
          status: 1 as const,
          status_text: '已支付',
          pay_time: new Date().toISOString()
        }
        setOrder(updatedOrder)
        updateOrderInList(order.id, {
          status: 1,
          status_text: '已支付'
        })
        Taro.showToast({ title: '支付成功', icon: 'success' })
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '支付失败', icon: 'none' })
    }
  }

  const handleReorder = async () => {
    if (!order || !order.items.length) {
      Taro.showToast({ title: '订单无菜品', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '添加中...' })
      
      let successCount = 0
      let failCount = 0

      for (const item of order.items) {
        try {
          await cartApi.addToCart({
            dish_id: item.dish_id,
            quantity: item.quantity,
            specs: item.specs && item.specs.length > 0 ? item.specs : undefined
          })
          successCount++
        } catch (error) {
          failCount++
        }
      }

      Taro.hideLoading()

      if (successCount === order.items.length) {
        await storage.setShowCartPanel(true)
        Taro.switchTab({
          url: '/pages/BrowseMenuList/index'
        })
      } else if (successCount > 0) {
        Taro.showToast({ 
          title: `成功${successCount}项，失败${failCount}项`, 
          icon: 'none' 
        })
      } else {
        Taro.showToast({ title: '添加失败', icon: 'none' })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  const getVisibleItems = () => {
    if (!order) return []
    if (showAllItems) return order.items
    return order.items.slice(0, MAX_VISIBLE_ITEMS)
  }

  const getSpecText = (specs: Order['items'][0]['specs']): string => {
    if (!specs || specs.length === 0) return ''
    return specs.map((s) => s.option.name).join(' / ')
  }

  const formatDateTime = (timeStr: string | null): string => {
    if (!timeStr) return '-'
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  const getOrderTypeText = (): string => {
    if (!order?.order_type) return '堂食'
    return order.order_type === 'dine_in' ? '堂食' : '自取'
  }

  if (loading) {
    return (
      <View className='order-detail'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  if (!order) {
    return (
      <View className='order-detail'>
        <View className='empty-container'>
          <Text className='empty-text'>订单不存在</Text>
        </View>
      </View>
    )
  }

  const visibleItems = getVisibleItems()

  return (
    <View className='order-detail'>
      <ScrollView className='detail-scroll' scrollY>
        <View className='shop-section'>
          <Text className='shop-name'>{getShopName()}</Text>
          <Text className='order-status' style={{ color: ORDER_STATUS_COLOR_MAP[order.status] }}>
            {order.status_text || ORDER_STATUS_MAP[order.status]}
          </Text>
        </View>

        <View className='items-section'>
          <View className='section-title'>订单内容</View>
          {visibleItems.map((item, index) => (
            <View key={index} className='item-row'>
              <Image className='item-image' src={item.dish_image} mode='aspectFill' />
              <View className='item-info'>
                <Text className='item-name'>{item.dish_name}</Text>
                {item.specs && item.specs.length > 0 && (
                  <Text className='item-specs'>{getSpecText(item.specs)}</Text>
                )}
                <Text className='item-quantity'>×{item.quantity}</Text>
              </View>
              <Text className='item-price'>¥{item.total_price.toFixed(2)}</Text>
            </View>
          ))}

          {order.items.length > MAX_VISIBLE_ITEMS && (
            <View className='view-more-btn' onClick={() => setShowAllItems(!showAllItems)}>
              <Text className='view-more-text'>
                {showAllItems ? '收起' : `查看更多（共${order.items.length}件）`}
              </Text>
            </View>
          )}

          <View className='total-row'>
            <Text className='total-label'>共{order.items.length}件</Text>
            <Text className='total-amount'>¥{order.pay_amount.toFixed(2)}</Text>
          </View>
        </View>

        <View className='info-section'>
          <View className='section-title'>用餐信息</View>

          <View className='info-row'>
            <Text className='info-label'>就餐方式</Text>
            <Text className='info-value'>{getOrderTypeText()}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>就餐时间</Text>
            <Text className='info-value'>{formatDateTime(order.created_at)}</Text>
          </View>

          {order.order_type !== 'takeaway' && (
            <View className='info-row'>
              <Text className='info-label'>桌号</Text>
              <Text className='info-value'>{order.table_number || '-'}</Text>
            </View>
          )}

          {order.order_type === 'takeaway' && order.contact_phone && (
            <View className='info-row'>
              <Text className='info-label'>联系电话</Text>
              <Text className='info-value'>{order.contact_phone}</Text>
            </View>
          )}
        </View>

        <View className='info-section'>
          <View className='section-title'>订单信息</View>

          <View className='info-row'>
            <Text className='info-label'>订单编号</Text>
            <Text className='info-value'>{order.order_no}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>下单时间</Text>
            <Text className='info-value'>{formatDateTime(order.created_at)}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>支付方式</Text>
            <Text className='info-value'>{order.status >= 1 ? '微信支付' : '-'}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>支付金额</Text>
            <Text className='info-value price'>¥{order.pay_amount.toFixed(2)}</Text>
          </View>

          <View className='info-row'>
            <Text className='info-label'>备注信息</Text>
            <Text className='info-value'>{order.remark || '无'}</Text>
          </View>
        </View>

        <View className='bottom-placeholder'></View>
      </ScrollView>

      {order.status === 0 && (
        <View className='bottom-bar'>
          <View className='cancel-btn' onClick={handleCancelOrder}>
            <Text className='cancel-btn-text'>取消订单</Text>
          </View>
          <View className='pay-btn' onClick={handlePayOrder}>
            <Text className='pay-btn-text'>立即支付</Text>
          </View>
        </View>
      )}

      {order.status !== 0 && (
        <View className='bottom-bar'>
          <View className='reorder-btn' onClick={handleReorder}>
            <Text className='reorder-btn-text'>再来一单</Text>
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderDetail

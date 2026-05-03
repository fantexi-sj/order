import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useReachBottom } from '@tarojs/taro'
import { useState } from 'react'
import useOrderStore from '../../store/order'
import useShopStore from '../../store/shop'
import useUserStore from '../../store/user'
import { orderApi } from '../../api/order'
import { cartApi } from '../../api/cart'
import { storage } from '../../utils/storage'
import type { Order, OrderStatus } from '../../types/order'
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from '../../types/order'

import './index.scss'

const MAX_VISIBLE_ITEMS = 1

const STATUS_TABS: { key: OrderStatus | undefined; label: string }[] = [
  { key: undefined, label: '全部' },
  { key: 0, label: '待支付' },
  { key: 3, label: '已完成' }
]

function ShoppingCart() {
  const { orderList, pagination, currentStatus, setOrderList, setPagination, setCurrentStatus } =
    useOrderStore()
  const { getShopName } = useShopStore()
  const { isLoggedIn } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())

  useDidShow(() => {
    if (isLoggedIn) {
      fetchOrderList(true)
    }
  })

  useReachBottom(() => {
    if (!loading && pagination.page < pagination.total_pages) {
      fetchOrderList(false)
    }
  })

  const fetchOrderList = async (refresh: boolean = false, statusValue?: OrderStatus | 'ALL') => {
    if (loading) return

    setLoading(true)
    try {
      const page = refresh ? 1 : pagination.page + 1
      const requestParams: { page: number; page_size: number; status?: OrderStatus } = {
        page,
        page_size: 10
      }
      
      if (statusValue === 'ALL') {
        // 全部订单，不传status
      } else if (statusValue !== undefined) {
        requestParams.status = statusValue
      } else if (currentStatus !== undefined) {
        requestParams.status = currentStatus
      }
      
      const res = await orderApi.getOrderList(requestParams)

      if (res.code === 200) {
        if (refresh) {
          setOrderList(res.data.list)
        } else {
          setOrderList([...orderList, ...res.data.list])
        }
        setPagination(res.data.pagination)
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (status: OrderStatus | undefined) => {
    setCurrentStatus(status)
    if (status === undefined) {
      fetchOrderList(true, 'ALL')
    } else {
      fetchOrderList(true, status)
    }
  }

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({
      url: `/pages/OrderDetail/index?id=${order.id}`
    })
  }

  const getVisibleItems = (order: Order) => {
    if (expandedOrders.has(order.id)) {
      return order.items
    }
    return order.items.slice(0, MAX_VISIBLE_ITEMS)
  }

  const getSpecText = (specs: Order['items'][0]['specs']): string => {
    if (!specs || specs.length === 0) return ''
    return specs.map((s) => s.option.name).join(' / ')
  }

  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  }

  const handleCancelOrder = async (e: any, orderId: number) => {
    e.stopPropagation()
    try {
      const res = await Taro.showModal({
        title: '提示',
        content: '确定要取消该订单吗？'
      })
      if (!res.confirm) return

      Taro.showLoading({ title: '取消中...' })
      const response = await orderApi.cancelOrder(orderId)
      Taro.hideLoading()

      if (response.code === 200) {
        Taro.showToast({ title: '订单已取消', icon: 'success' })
        fetchOrderList(true)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '取消失败', icon: 'none' })
    }
  }

  const handlePayOrder = async (e: any, orderId: number) => {
    e.stopPropagation()
    try {
      Taro.showLoading({ title: '支付中...' })
      const response = await orderApi.payOrder(orderId)
      Taro.hideLoading()

      if (response.code === 200) {
        Taro.showToast({ title: '支付成功', icon: 'success' })
        fetchOrderList(true)
      }
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '支付失败', icon: 'none' })
    }
  }

  const handleReorder = async (e: any, order: Order) => {
    e.stopPropagation()
    
    if (!order.items.length) {
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

  const handleReview = (e: any, orderId: number) => {
    e.stopPropagation()
    Taro.showToast({ title: '评价功能开发中', icon: 'none' })
  }

  return (
    <View className='shopping-cart'>
      <View className='tab-container'>
        {STATUS_TABS.map((tab) => (
          <View
            key={tab.key ?? 'all'}
            className={`tab-item ${currentStatus === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <Text className='tab-text'>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView className='order-scroll' scrollY>
        {!isLoggedIn ? (
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
              <Text className='empty-text'>请先登录查看订单记录</Text>
              <View
                className='login-btn'
                onClick={() => Taro.navigateTo({ url: '/pages/Login/index' })}
              >
                <Text className='login-btn-text'>去登录</Text>
              </View>
            </View>
          </View>
        ) : orderList.length === 0 && !loading ? (
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
        ) : (
          <View className='order-list'>
            {orderList.map((order) => (
              <View key={order.id} className='order-card' onClick={() => handleOrderClick(order)}>
                <View className='order-header'>
                  <Text className='shop-name'>{getShopName()}</Text>
                  <Text className='order-status' style={{ color: ORDER_STATUS_COLOR_MAP[order.status] }}>
                    {order.status_text || ORDER_STATUS_MAP[order.status]}
                  </Text>
                </View>

                <View className='order-items'>
                  {getVisibleItems(order).map((item, index) => (
                    <View key={index} className='order-item'>
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
                    <View
                      className='view-more-btn'
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOrderExpand(order.id)
                      }}
                    >
                      <Text className='view-more-text'>
                        {expandedOrders.has(order.id)
                          ? '收起'
                          : `查看更多（共${order.items.length}件）`}
                      </Text>
                    </View>
                  )}
                </View>

                <View className='order-footer'>
                  <Text className='order-time'>{formatTime(order.created_at)}</Text>
                  <View className='order-total'>
                    <Text className='total-label'>共{order.items.length}件 实付</Text>
                    <Text className='total-price'>¥{order.pay_amount.toFixed(2)}</Text>
                  </View>
                </View>

                {(order.status === 0 || order.status === 1) && (
                  <View className='order-actions'>
                    {order.status === 0 && (
                      <>
                        <View
                          className='action-btn cancel-btn'
                          onClick={(e) => handleCancelOrder(e, order.id)}
                        >
                          <Text className='action-btn-text'>取消订单</Text>
                        </View>
                        <View
                          className='action-btn pay-btn'
                          onClick={(e) => handlePayOrder(e, order.id)}
                        >
                          <Text className='action-btn-text'>去支付</Text>
                        </View>
                      </>
                    )}
                    {order.status === 1 && (
                      <>
                        <View
                          className='action-btn reorder-btn'
                          onClick={(e) => handleReorder(e, order)}
                        >
                          <Text className='action-btn-text'>再来一单</Text>
                        </View>
                        <View
                          className='action-btn review-btn'
                          onClick={(e) => handleReview(e, order.id)}
                        >
                          <Text className='action-btn-text'>评价</Text>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View className='loading-more'>
                <Text className='loading-text'>加载中...</Text>
              </View>
            )}
          </View>
        )}

        <View className='bottom-placeholder'></View>
      </ScrollView>
    </View>
  )
}

export default ShoppingCart

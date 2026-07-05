import { View, Text, Image } from '@tarojs/components'
import Taro, { useReachBottom, usePullDownRefresh } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Sparkles, Coins } from 'lucide-react-taro'
import useUserStore from '../../store/user'
import usePointsMallStore from '../../store/points'
import type { PointsProduct, ExchangeLog, ExchangeResult } from '../../types/points'
import ExchangeSuccessModal from '../../components/ExchangeSuccessModal'
import './index.scss'

const PAGE_SIZE = 10

function PointsMall() {
  const [activeTab, setActiveTab] = useState(0)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [exchangeResult, setExchangeResult] = useState<ExchangeResult | null>(null)
  const { userInfo, getUserPoints, fetchUserInfoWithMember, setUserPoints } = useUserStore()
  const {
    products,
    productPagination,
    productLoading,
    exchangeLogs,
    exchangeLogPagination,
    exchangeLogLoading,
    fetchProductList,
    exchangeProduct,
    resetProductList,
    fetchExchangeLogList,
    resetExchangeLogList
  } = usePointsMallStore()

  const userPoints = getUserPoints()

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return dateString.split(' ')[0]
  }

  useEffect(() => {
    resetProductList()
    resetExchangeLogList()
    fetchProductList(1, true)
    fetchUserInfoWithMember()
  }, [])

  useEffect(() => {
    if (activeTab === 1 && exchangeLogs.length === 0) {
      fetchExchangeLogList(1, true)
    }
  }, [activeTab])

  usePullDownRefresh(() => {
    resetProductList()
    resetExchangeLogList()
    const promises = [
      fetchProductList(1, true),
      fetchUserInfoWithMember()
    ]
    if (activeTab === 1) {
      promises.push(fetchExchangeLogList(1, true))
    }
    Promise.all(promises).finally(() => {
      Taro.stopPullDownRefresh()
    })
  })

  useReachBottom(() => {
    if (activeTab === 0) {
      if (productLoading) return
      const { page, total } = productPagination
      const currentLoadedCount = page * PAGE_SIZE
      if (currentLoadedCount >= total) return
      fetchProductList(page + 1)
    } else {
      if (exchangeLogLoading) return
      const { page, total } = exchangeLogPagination
      const currentLoadedCount = page * PAGE_SIZE
      if (currentLoadedCount >= total) return
      fetchExchangeLogList(page + 1)
    }
  })

  // 处理商品兑换
  const handleExchange = async (product: PointsProduct) => {
    if (userPoints < product.points) {
      Taro.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }

    if (product.stock <= 0) {
      Taro.showToast({
        title: '已兑换完',
        icon: 'none'
      })
      return
    }

    Taro.showModal({
      title: '确认兑换',
      content: `确定使用 ${product.points} 积分兑换 ${product.name} 吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            Taro.showLoading({ title: '兑换中...' })
            const result = await exchangeProduct(product.id)

            if (result) {
              Taro.hideLoading()
              setExchangeResult(result)
              setShowExchangeModal(true)
              setUserPoints(result.remain_points)
              resetProductList()
              resetExchangeLogList()
              fetchProductList(1, true)
              fetchExchangeLogList(1, true)
            }
          } catch (error: any) {
            Taro.hideLoading()
            Taro.showToast({
              title: error.message || '兑换失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 关闭兑换成功弹窗
  const handleCloseExchangeModal = () => {
    setShowExchangeModal(false)
    setExchangeResult(null)
  }

  const handleTabChange = (index: number) => {
    setActiveTab(index)
  }

  const handleExchangeLogClick = (log: ExchangeLog) => {
    Taro.navigateTo({
      url: `/pages/ExchangeDetail/index?id=${log.id}`
    })
  }

  const getStatusStyle = (status: number) => {
    switch (status) {
      case 1:
        return 'status-pending'
      case 2:
        return 'status-completed'
      case 3:
        return 'status-expired'
      default:
        return ''
    }
  }

  const getStatusText = (status: number, statusText: string) => {
    if (status === 1) {
      return '待核销'
    }
    return statusText
  }

  return (
    <View className='points-mall'>
      <View className='user-info-card'>
        <View className='user-info-left'>
          <Image
            className='user-avatar'
            src={userInfo.avatarUrl || '/assets/tabbar/user.png'}
            mode='aspectFill'
          />
          <View className='user-details'>
            <Text className='user-name'>{userInfo.name || '游客'}</Text>
            <View className='points-display'>
              <Coins size={16} color='#FFB74D' />
              <Text className='points-text'>当前积分: {userPoints}</Text>
            </View>
          </View>
        </View>
        <View className='points-icon-wrapper'>
          <Sparkles size={28} color='#FFB74D' />
        </View>
      </View>

      <View className='tab-bar'>
        <View
          className={`tab-item ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          <Text className='tab-text'>可兑换菜品</Text>
        </View>
        <View
          className={`tab-item ${activeTab === 1 ? 'active' : ''}`}
          onClick={() => handleTabChange(1)}
        >
          <Text className='tab-text'>兑换记录</Text>
        </View>
      </View>

      {activeTab === 0 ? (
        <View className='products-section'>
          {productLoading && products.length === 0 ? (
            <View className='loading-container'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          ) : products.length === 0 ? (
            <View className='loading-container'>
              <Text className='loading-text'>暂无可兑换商品</Text>
            </View>
          ) : (
            <View className='products-grid'>
              {products.map((product) => (
                <View key={product.id} className='product-card'>
                  <View className='product-image-wrapper'>
                    <Image
                      className='product-image'
                      src={product.image}
                      mode='aspectFill'
                    />
                    <View className='product-badge'>
                      <Text className='badge-text'>剩余 {product.stock} 份</Text>
                    </View>
                  </View>

                  <View className='product-info'>
                    <Text className='product-name'>{product.name}</Text>
                    {product.dish_name && (
                      <Text className='product-description'>{product.dish_name}</Text>
                    )}

                    <View className='product-footer'>
                      <View className='points-info'>
                        <Coins size={14} color='#FFB74D' />
                        <Text className='points-value'>{product.points}</Text>
                      </View>

                      <View
                        className={`exchange-btn ${userPoints >= product.points && product.stock > 0 ? 'active' : 'disabled'}`}
                        onClick={() => handleExchange(product)}
                      >
                        <Text className='exchange-btn-text'>兑换</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {productLoading && products.length > 0 && (
            <View className='loading-container'>
              <Text className='loading-text'>加载更多...</Text>
            </View>
          )}

          {!productLoading && products.length > 0 && productPagination.total > 0 && (
            <View className='loading-container'>
              {productPagination.page * PAGE_SIZE >= productPagination.total ? (
                <Text className='loading-text'>没有更多了</Text>
              ) : null}
            </View>
          )}
        </View>
      ) : (
        <View className='exchange-logs-section'>
          {exchangeLogLoading && exchangeLogs.length === 0 ? (
            <View className='loading-container'>
              <Text className='loading-text'>加载中...</Text>
            </View>
          ) : exchangeLogs.length === 0 ? (
            <View className='loading-container'>
              <Text className='loading-text'>暂无兑换记录</Text>
            </View>
          ) : (
            <View className='exchange-logs-list'>
              {exchangeLogs.map((log) => (
                <View
                  key={log.id}
                  className='exchange-log-card'
                  onClick={() => handleExchangeLogClick(log)}
                >
                  <View className='log-image-wrapper'>
                    <Image
                      className='log-image'
                      src={log.product_image}
                      mode='aspectFill'
                    />
                  </View>

                  <View className='log-info'>
                    <View className='log-header'>
                      <Text className='log-product-name'>{log.product_name}</Text>
                      <View className={`log-status ${getStatusStyle(log.status)}`}>
                        <Text className='status-text'>{getStatusText(log.status, log.status_text)}</Text>
                      </View>
                    </View>

                    {log.dish_name && (
                      <Text className='log-dish-name'>{log.dish_name}</Text>
                    )}

                    <View className='log-footer'>
                      <View className='log-points'>
                        <Coins size={14} color='#FFB74D' />
                        <Text className='log-points-text'>{log.points} 积分</Text>
                      </View>
                      <Text className='log-time'>{formatDate(log.created_at)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {exchangeLogLoading && exchangeLogs.length > 0 && (
            <View className='loading-container'>
              <Text className='loading-text'>加载更多...</Text>
            </View>
          )}

          {!exchangeLogLoading && exchangeLogs.length > 0 && exchangeLogPagination.total > 0 && (
            <View className='loading-container'>
              {exchangeLogPagination.page * PAGE_SIZE >= exchangeLogPagination.total ? (
                <Text className='loading-text'>没有更多了</Text>
              ) : null}
            </View>
          )}
        </View>
      )}

      <ExchangeSuccessModal
        visible={showExchangeModal}
        exchangeResult={exchangeResult}
        onClose={handleCloseExchangeModal}
      />
    </View>
  )
}

export default PointsMall

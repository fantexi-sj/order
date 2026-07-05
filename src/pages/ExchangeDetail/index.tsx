import { View, Text, Image, Canvas } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { Coins, Clock, Sparkles, FileText, Gift } from 'lucide-react-taro'
import drawQrcode from 'weapp-qrcode-canvas-2d'
import usePointsMallStore from '../../store/points'
import './index.scss'

function ExchangeDetail() {
  const router = useRouter()
  const { currentExchangeLog, fetchExchangeLogDetail, exchangeLogLoading } = usePointsMallStore()
  const [qrCodeImage, setQrCodeImage] = useState('')

  useEffect(() => {
    const id = router.params.id
    if (id) {
      fetchExchangeLogDetail(Number(id))
    }
  }, [router.params.id])

  // 生成二维码
  useEffect(() => {
    if (currentExchangeLog && currentExchangeLog.status === 1 && currentExchangeLog.exchange_no) {
      setTimeout(() => {
        generateQRCode(currentExchangeLog.exchange_no)
      }, 100)
    }
  }, [currentExchangeLog])

  // 格式化日期只保留年月日
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    return dateString.split(' ')[0]
  }

  // 生成二维码
  const generateQRCode = (text: string) => {
    try {
      const query = Taro.createSelectorQuery()
      query.select('#qrcode-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node
            drawQrcode({
              canvas: canvas,
              canvasId: 'qrcode-canvas',
              width: 200,
              padding: 10,
              background: '#ffffff',
              foreground: '#000000',
              text: text,
            })
            
            setTimeout(() => {
              Taro.canvasToTempFilePath({
                canvas: canvas,
                canvasId: 'qrcode-canvas',
                success: (res) => {
                  setQrCodeImage(res.tempFilePath)
                },
                fail: (err) => {
                  console.error('生成二维码图片失败:', err)
                }
              })
            }, 200)
          }
        })
    } catch (error) {
      console.error('生成二维码失败:', error)
    }
  }

  // 复制兑换码
  const handleCopyCode = () => {
    if (currentExchangeLog?.exchange_no) {
      Taro.setClipboardData({
        data: currentExchangeLog.exchange_no,
        success: () => {
          Taro.showToast({
            title: '复制成功',
            icon: 'success'
          })
        }
      })
    }
  }

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <Gift size={48} color='#F57C00' />
      case 2:
        return <Sparkles size={48} color='#388E3C' />
      case 3:
        return <FileText size={48} color='#D32F2F' />
      default:
        return null
    }
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

  const getStatusText = (status: number) => {
    switch (status) {
      case 1:
        return '待核销'
      case 2:
        return '已核销'
      case 3:
        return '已过期'
      default:
        return '未知状态'
    }
  }

  if (exchangeLogLoading || !currentExchangeLog) {
    return (
      <View className='exchange-detail'>
        <View className='loading-container'>
          <Text className='loading-text'>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='exchange-detail'>
      <View className='status-card'>
        <View className='status-icon'>
          {getStatusIcon(currentExchangeLog.status)}
        </View>
        <Text className='status-title'>{getStatusText(currentExchangeLog.status)}</Text>
        <Text className='product-name-title'>{currentExchangeLog.product_name}</Text>
        {currentExchangeLog.dish_name && (
          <Text className='dish-name-subtitle'>{currentExchangeLog.dish_name}</Text>
        )}
      </View>

      {currentExchangeLog.status === 1 && (
        <View className='qrcode-card'>
          <View className='qrcode-wrapper'>
            <Canvas 
              type='2d'
              id='qrcode-canvas'
              canvasId='qrcode-canvas'
              className='qrcode-canvas'
            />
            {qrCodeImage && (
              <Image 
                className='qrcode-image' 
                src={qrCodeImage} 
                mode='aspectFit'
              />
            )}
          </View>
          <View className='exchange-code-section'>
            <Text className='code-label'>兑换码</Text>
            <View className='code-row'>
              <Text className='code-value'>{currentExchangeLog.exchange_no}</Text>
              <View className='copy-btn' onClick={handleCopyCode}>
                <Text className='copy-btn-text'>复制</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className='detail-card'>
        <View className='product-info'>
          <Image
            className='product-image'
            src={currentExchangeLog.product_image}
            mode='aspectFill'
          />
          <View className='product-details'>
            {currentExchangeLog.dish_price && (
              <Text className='dish-price'>菜品价值: ¥{currentExchangeLog.dish_price}</Text>
            )}
          </View>
        </View>

        <View className='info-section'>
          {currentExchangeLog.status !== 1 && (
            <View className='info-item'>
              <Text className='info-label'>兑换码</Text>
              <Text className='info-value code-text'>{currentExchangeLog.exchange_no}</Text>
            </View>
          )}

          <View className='info-item'>
            <View className='info-label-with-icon'>
              <Coins size={16} color='#FFB74D' />
              <Text className='info-label'>消耗积分</Text>
            </View>
            <Text className='info-value points'>{currentExchangeLog.points}</Text>
          </View>

          <View className='info-item'>
            <View className='info-label-with-icon'>
              <Clock size={16} color='#757575' />
              <Text className='info-label'>有效期至</Text>
            </View>
            <Text className='info-value'>{formatDate(currentExchangeLog.expire_at)}</Text>
          </View>

          <View className='info-item'>
            <Text className='info-label'>兑换时间</Text>
            <Text className='info-value'>{formatDate(currentExchangeLog.created_at)}</Text>
          </View>

          {currentExchangeLog.used_at && (
            <View className='info-item'>
              <Text className='info-label'>核销时间</Text>
              <Text className='info-value'>{formatDate(currentExchangeLog.used_at)}</Text>
            </View>
          )}
        </View>
      </View>

      {currentExchangeLog.status === 1 && (
        <View className='tips-card'>
          <Text className='tips-title'>使用说明</Text>
          <Text className='tips-text'>1. 请到店出示兑换码给商家核销</Text>
          <Text className='tips-text'>2. 兑换码有效期内使用，过期作废</Text>
          <Text className='tips-text'>3. 每个兑换码仅可使用一次</Text>
        </View>
      )}

      {currentExchangeLog.status === 3 && (
        <View className='tips-card expired'>
          <Text className='tips-title'>已过期</Text>
          <Text className='tips-text'>该兑换券已超过有效期，无法使用</Text>
        </View>
      )}
    </View>
  )
}

export default ExchangeDetail

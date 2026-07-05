import { View, Text, Canvas, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import drawQrcode from 'weapp-qrcode-canvas-2d'
import type { ExchangeResult } from '../../types/points'
import './exchange-success-modal.scss'

interface ExchangeSuccessModalProps {
  visible: boolean
  exchangeResult: ExchangeResult | null
  onClose: () => void
}

function ExchangeSuccessModal({ visible, exchangeResult, onClose }: ExchangeSuccessModalProps) {
  const [qrCodeImage, setQrCodeImage] = useState('')
  const canvasRef = useRef<string>('qrcode-canvas-' + Date.now())

  // 格式化日期只保留年月日
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return ''
    return dateString.split(' ')[0]
  }

  // 生成二维码
  useEffect(() => {
    if (visible && exchangeResult?.exchange_no) {
      setTimeout(() => {
        generateQRCode(exchangeResult.exchange_no)
      }, 100)
    }
  }, [visible, exchangeResult])

  // 使用 weapp-qrcode-canvas-2d 生成二维码
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
    if (exchangeResult?.exchange_no) {
      Taro.setClipboardData({
        data: exchangeResult.exchange_no,
        success: () => {
          Taro.showToast({
            title: '复制成功',
            icon: 'success'
          })
        }
      })
    }
  }

  if (!visible || !exchangeResult) return null

  return (
    <View className='exchange-success-modal'>
      <View className='modal-mask' onClick={onClose} />
      <View className='modal-content'>
        <View className='modal-header'>
          <Text className='modal-title'>兑换成功</Text>
        </View>
        
        <View className='modal-body'>
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
          
          <View className='exchange-info'>
            <View className='info-row'>
              <Text className='info-label'>兑换码：</Text>
              <Text className='info-value code-value'>{exchangeResult.exchange_no}</Text>
              <View className='copy-btn' onClick={handleCopyCode}>
                <Text className='copy-btn-text'>复制</Text>
              </View>
            </View>
            
            <View className='info-row'>
              <Text className='info-label'>商品名称：</Text>
              <Text className='info-value'>{exchangeResult.product_name}</Text>
            </View>
            
            <View className='info-row'>
              <Text className='info-label'>消耗积分：</Text>
              <Text className='info-value points-value'>{exchangeResult.points} 积分</Text>
            </View>
            
            <View className='info-row'>
              <Text className='info-label'>有效期至：</Text>
              <Text className='info-value'>{formatDateOnly(exchangeResult.expire_at)}</Text>
            </View>
          </View>
        </View>
        
        <View className='modal-footer'>
          <View className='confirm-btn' onClick={onClose}>
            <Text className='confirm-btn-text'>确定</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ExchangeSuccessModal

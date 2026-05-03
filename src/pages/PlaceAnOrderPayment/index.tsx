import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import useShopStore from '../../store/shop'
import useCartStore from '../../store/cart'
import useUserStore from '../../store/user'
import { orderApi } from '../../api/order'
import { storage } from '../../utils/storage'
import type { CartItem } from '../../types/cart'
import type { OrderType, PaymentMethod, DateOption, TimeSlot } from '../../types/order'
import LoginModal from '../../components/LoginModal'

import './index.scss'

const MAX_VISIBLE_ITEMS = 3

function PlaceAnOrderPayment() {
  const { getShopName, getShopAddress } = useShopStore()
  const { getSelectedItems, clearCart } = useCartStore()
  const { isLoggedIn } = useUserStore()

  const [orderType, setOrderType] = useState<OrderType>('takeaway')
  const [pickupTimeText, setPickupTimeText] = useState('现在取单')
  const [phone, setPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat')
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(-1)

  /** 页面初始化：获取订单类型、生成时间选项 */
  useEffect(() => {
    initOrderData()
  }, [])

  /** 初始化订单数据 */
  const initOrderData = async () => {
    const savedType = await storage.getOrderType()
    if (savedType === 'dine_in' || savedType === 'takeaway') {
      setOrderType(savedType)
    }
    generateTimeSlots()
  }

  /** 生成今天和明天的时间段选项（间隔50分钟） */
  const generateTimeSlots = () => {
    const now = new Date()
    const todayStr = formatDate(now)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = formatDate(tomorrow)

    const slots = generateDayTimeSlots(now)
    const tomorrowSlots = generateDayTimeSlots(tomorrow, true)

    setDateOptions([
      { label: `今天（${todayStr}）`, date: todayStr, slots },
      { label: `明天（${tomorrowStr}）`, date: tomorrowStr, slots: tomorrowSlots }
    ])
  }

  /** 格式化日期为 MM/DD */
  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
  }

  /** 生成某一天的时间段列表，间隔50分钟，过滤已过去的时间 */
  const generateDayTimeSlots = (_baseDate: Date, isTomorrow = false): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    const startHour = isTomorrow ? 10 : currentHour
    let startMinute = isTomorrow ? 0 : currentMinute

    if (!isTomorrow) {
      startMinute = Math.ceil(currentMinute / 50) * 50
      if (startMinute >= 60) {
        startMinute = 0
      }
    }

    for (let h = startHour; h <= 22; h++) {
      let mStart = startMinute
      if (h > startHour || isTomorrow) {
        mStart = 0
      }
      for (let m = mStart; m < 60; m += 50) {
        if (!isTomorrow && h === currentHour && m <= currentMinute) {
          continue
        }
        const hourStr = h.toString().padStart(2, '0')
        const minuteStr = m.toString().padStart(2, '0')
        slots.push({ label: `${hourStr}:${minuteStr}`, value: `${hourStr}:${minuteStr}` })
      }
    }
    return slots
  }

  /** 打开自提时间选择弹窗 */
  const handleOpenTimePicker = () => {
    setShowTimePicker(true)
    setSelectedDateIndex(0)
    setSelectedTimeIndex(-1)
  }

  /** 确认选择的自提时间 */
  const handleConfirmTime = () => {
    if (selectedDateIndex >= 0 && selectedTimeIndex >= 0) {
      const slot = dateOptions[selectedDateIndex]?.slots[selectedTimeIndex]
      if (slot) {
        setPickupTimeText(slot.label)
      }
    } else {
      setPickupTimeText('现在取单')
    }
    setShowTimePicker(false)
  }

  /** 验证手机号格式 */
  const validatePhone = (value: string): boolean => {
    return /^1[3-9]\d{9}$/.test(value)
  }

  /** 处理手机号输入失焦校验 */
  const handlePhoneBlur = () => {
    if (phone && !validatePhone(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
    }
  }

  /** 获取当前显示的订单商品列表 */
  const getVisibleItems = (): CartItem[] => {
    const selected = getSelectedItems()
    if (showAllItems) return selected
    return selected.slice(0, MAX_VISIBLE_ITEMS)
  }

  /** 计算当前选中商品的总金额 */
  const currentTotalPrice = (): number => {
    return getVisibleItems().reduce((sum, item) => sum + item.total_price, 0)
  }

  /** 获取购物车商品的规格文字描述 */
  const getSpecText = (item: CartItem): string => {
    if (!item.specs || item.specs.length === 0) return ''
    return item.specs.map((s) => s.option.name).join(' / ')
  }

  /** 点击付款按钮，创建订单并支付 */
  const handlePay = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }

    if (orderType === 'takeaway' && !phone) {
      Taro.showToast({ title: '请填写预留电话', icon: 'none' })
      return
    }
    if (orderType === 'takeaway' && phone && !validatePhone(phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      return
    }

    const cartIds = selectedItems.map((item) => item.id)

    try {
      Taro.showLoading({ title: '提交订单中...' })

      const createRes = await orderApi.createOrder({
        cart_ids: cartIds.join(','),
        remark: remark || undefined,
        order_type: orderType,
        phone: phone || undefined
      })

      if (createRes.code !== 200) {
        throw new Error(createRes.message || '创建订单失败')
      }

      const orderId = createRes.data.order_id

      const payRes = await orderApi.payOrder(orderId)

      Taro.hideLoading()

      if (payRes.code === 200) {
        Taro.showToast({ title: '下单成功', icon: 'success' })
        clearCart()
        Taro.switchTab({ url: '/pages/ShoppingCart/index' })
      } else {
        throw new Error(payRes.message || '支付失败')
      }
    } catch (error: any) {
      Taro.hideLoading()
      console.error('提交订单失败:', error)
      Taro.showToast({ title: error.message || '下单失败，请重试', icon: 'none' })
    }
  }

  /** 登录成功回调 */
  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    handlePay()
  }

  const visibleItems = getVisibleItems()
  const allSelectedItems = getSelectedItems()

  return (
    <View className='order-page'>
      <ScrollView className='order-scroll' scrollY>
        {/* 订单类型标题 */}
        <View className='order-header'>
          <Text className='order-type-text'>
            {orderType === 'dine_in' ? '堂食点单' : '到店自提'}
          </Text>
        </View>

        {/* 商家地址 */}
        <View className='address-section'>
          <View className='address-left'>
            <Text className='address-label'>商家地址</Text>
            <Text className='address-text'>{getShopAddress()}</Text>
          </View>
          <View className='address-right'>
            <View className='map-preview'>
              <View className='map-bg'></View>
              <View className='map-vignette'></View>
              <View className='location-pin'>
                <Text className='pin-icon'>📍</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 自提时间和预留电话 - 仅到店自提显示 */}
        {orderType === 'takeaway' && (
          <View className='pickup-section'>
            {/* 自提时间 */}
            <View className='pickup-row' onClick={handleOpenTimePicker}>
              <Text className='pickup-label'>自提时间</Text>
              <View className='pickup-right'>
                <Text className={`pickup-value ${pickupTimeText !== '现在取单' ? 'selected' : ''}`}>
                  {pickupTimeText}
                </Text>
                <Text className='arrow-icon'>›</Text>
              </View>
            </View>

            {/* 预留电话 */}
            <View className='pickup-row phone-row'>
              <Text className='pickup-label'>预留电话</Text>
              <View className='phone-input-wrap'>
                <Text className='phone-prefix'>+86</Text>
                <Text className='arrow-icon-small'>∨</Text>
              </View>
              <Input
                className='phone-input'
                type='number'
                maxlength={11}
                placeholder='请填写手机号'
                value={phone}
                onInput={(e) => setPhone(e.detail.value)}
                onBlur={handlePhoneBlur}
              />
            </View>
          </View>
        )}

        {/* 商品列表区域 */}
        <View className='goods-section'>
          <View className='shop-name-bar'>
            <Text className='shop-name'>{getShopName()}</Text>
          </View>

          {visibleItems.map((item) => (
            <View key={item.id} className='goods-item'>
              <Image className='goods-image' src={item.dish_image} mode='aspectFill' />
              <View className='goods-info'>
                <Text className='goods-name'>{item.dish_name}</Text>
                <Text className='goods-specs'>{getSpecText(item)}</Text>
                <Text className='goods-quantity'>×{item.quantity}</Text>
              </View>
              <Text className='goods-price'>¥{item.unit_price.toFixed(1)}</Text>
            </View>
          ))}

          {/* 查看更多按钮 */}
          {allSelectedItems.length > MAX_VISIBLE_ITEMS && (
            <View
              className='view-more-btn'
              onClick={() => setShowAllItems(!showAllItems)}
            >
              <Text className='view-more-text'>
                {showAllItems ? '收起' : `查看更多（共${allSelectedItems.length}件）`}
              </Text>
            </View>
          )}
        </View>

        {/* 优惠券 */}
        <View className='coupon-row'>
          <Text className='row-label'>优惠券</Text>
          <View className='row-right'>
            <Text className='coupon-empty'>暂无可用</Text>
            <Text className='arrow-icon'>›</Text>
          </View>
        </View>

        {/* 应付金额 */}
        <View className='amount-row'>
          <Text className='row-label'></Text>
          <Text className='amount-value'>
            应付：<Text className='amount-num'>¥{currentTotalPrice().toFixed(1)}</Text>
          </Text>
        </View>

        {/* 备注 */}
        <View className='remark-row'>
          <Text className='row-label'>备注</Text>
          <Input
            className='remark-input'
            placeholder='请填写备注信息'
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>

        {/* 支付方式 */}
        <View className='payment-section'>
          <Text className='payment-title'>支付方式</Text>

          {/* 会员卡支付 */}
          <View className='payment-option'>
            <View className='payment-left'>
              <Text className='vip-badge'>VIP</Text>
              <Text className='payment-name'>会员卡支付（余额¥0）</Text>
            </View>
            <View className='login-member-btn'>
              <Text className='login-member-text'>登录会员</Text>
            </View>
          </View>

          {/* 微信支付 */}
          <View
            className={`payment-option ${paymentMethod === 'wechat' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('wechat')}
          >
            <View className='payment-left'>
               <View className='pay-icon wechat-icon'>
                <Text className='icon-check'>✓</Text>
              </View>
              <Text className='payment-name'>微信支付</Text>
            </View>
            <View className={`radio-circle ${paymentMethod === 'wechat' ? 'checked' : ''}`}>
              {paymentMethod === 'wechat' && <View className='radio-dot'></View>}
            </View>
          </View>

          {/* 支付宝支付 */}
          <View
            className={`payment-option ${paymentMethod === 'alipay' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('alipay')}
          >
            <View className='payment-left'>
              <View className='pay-icon alipay-icon'>
                <Text className='icon-zhi'>支</Text>
              </View>
              <Text className='payment-name'>支付宝</Text>
            </View>
            <View className={`radio-circle ${paymentMethod === 'alipay' ? 'checked' : ''}`}>
              {paymentMethod === 'alipay' && <View className='radio-dot'></View>}
            </View>
          </View>
        </View>

        {/* 底部占位 */}
        <View className='bottom-placeholder'></View>
      </ScrollView>

      {/* 底部结算栏 */}
      <View className='bottom-bar'>
        <Text className='bottom-total'>
          ¥{currentTotalPrice().toFixed(1)}
        </Text>
        <View className='pay-btn' onClick={handlePay}>
          <Text className='pay-btn-text'>付款</Text>
        </View>
      </View>

      {/* 自提时间选择弹窗 */}
      {showTimePicker && (
        <View className='time-picker-mask' onClick={() => setShowTimePicker(false)}>
          <View className='time-picker-content' onClick={(e) => e.stopPropagation()}>
            <View className='picker-header'>
              <Text className='picker-title'>请选择取单时间</Text>
              <Text className='picker-close' onClick={() => setShowTimePicker(false)}>×</Text>
            </View>

            <View className='picker-body'>
              {/* 左侧日期导航 */}
              <ScrollView className='date-nav' scrollY>
                {dateOptions.map((option, index) => (
                  <View
                    key={index}
                    className={`date-item ${selectedDateIndex === index ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDateIndex(index)
                      setSelectedTimeIndex(-1)
                    }}
                  >
                    <Text className='date-item-text'>{option.label}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* 右侧时间段 */}
              <ScrollView className='time-list' scrollY>
                {dateOptions[selectedDateIndex]?.slots.map((slot, index) => (
                  <View
                    key={index}
                    className={`time-slot ${selectedTimeIndex === index ? 'active' : ''}`}
                    onClick={() => setSelectedTimeIndex(index)}
                  >
                    <Text className='time-slot-text'>{slot.label}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View className='picker-footer'>
              <View className='confirm-btn' onClick={handleConfirmTime}>
                <Text className='confirm-btn-text'>确定</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <LoginModal 
        visible={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
      />
    </View>
  )
}

export default PlaceAnOrderPayment

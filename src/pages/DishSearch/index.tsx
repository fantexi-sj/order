import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import useMenuStore from '../../store/menu'
import useCartStore from '../../store/cart'
import useCartActions from '../../hooks/useCartActions'
import { merchantApi } from '../../api/merchant'
import { storage } from '../../utils/storage'
import type { DishItem, SpecGroup, DishSpecsData } from '../../types/menu'
import type { CartAddSpecItem } from '../../types/cart'

import './index.scss'

interface SearchHistoryItem {
  keyword: string
  time: number
}

const SEARCH_HISTORY_KEY = 'dish_search_history'
const MAX_HISTORY_COUNT = 10

function DishSearch() {
  const { categories } = useMenuStore()
  const { getDishQuantity, items: cartItems } = useCartStore()
  const { addToCart, updateCartItemQuantity } = useCartActions()

  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<DishItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isResting, setIsResting] = useState(false)

  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null)
  const [showSpecModal, setShowSpecModal] = useState(false)
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})
  const [specQuantity, setSpecQuantity] = useState(1)
  const [specLoading, setSpecLoading] = useState(false)

  const inputRef = useRef<any>(null)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadSearchHistory()
    checkBusinessStatus()

    setTimeout(() => {
      inputRef.current?.focus()
    }, 300)
  }, [])

  const loadSearchHistory = async () => {
    try {
      const history = await storage.get(SEARCH_HISTORY_KEY)
      if (history && Array.isArray(history)) {
        setSearchHistory(history)
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error)
    }
  }

  const saveSearchHistory = async (keyword: string) => {
    try {
      const newHistory: SearchHistoryItem[] = [
        { keyword, time: Date.now() },
        ...searchHistory.filter(item => item.keyword !== keyword)
      ].slice(0, MAX_HISTORY_COUNT)

      setSearchHistory(newHistory)
      await storage.set(SEARCH_HISTORY_KEY, newHistory)
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  const clearSearchHistory = async () => {
    try {
      const res = await Taro.showModal({
        title: '提示',
        content: '确定清空搜索历史吗？'
      })
      if (res.confirm) {
        setSearchHistory([])
        await storage.remove(SEARCH_HISTORY_KEY)
      }
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }

  const checkBusinessStatus = async () => {
    try {
      const res = await merchantApi.getMerchantInfo()
      const businessHours = res.data.business_hours
      if (businessHours) {
        const [startTime, endTime] = businessHours.split('-')
        if (startTime && endTime) {
          const now = new Date()
          const currentTime = now.getHours() * 60 + now.getMinutes()
          const [startHour, startMin] = startTime.split(':').map(Number)
          const [endHour, endMin] = endTime.split(':').map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          setIsResting(currentTime < startMinutes || currentTime > endMinutes)
        }
      }
    } catch (error) {
      console.error('检查营业状态失败:', error)
    }
  }

  const getAllDishes = (): DishItem[] => {
    const allDishes: DishItem[] = []
    const dishIds = new Set<number>()

    categories.forEach(category => {
      if (category.dishes) {
        category.dishes.forEach(dish => {
          if (!dishIds.has(dish.id)) {
            dishIds.add(dish.id)
            allDishes.push({ ...dish, category_id: category.id })
          }
        })
      }
    })

    return allDishes
  }

  const handleInputChange = (value: string) => {
    setSearchValue(value)

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    if (!value.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    searchTimerRef.current = setTimeout(() => {
      performSearch(value.trim())
    }, 300)
  }

  const performSearch = (keyword: string) => {
    setIsSearching(true)
    setHasSearched(true)

    const allDishes = getAllDishes()
    const results = allDishes.filter(dish =>
      dish.name.toLowerCase().includes(keyword.toLowerCase())
    )

    setSearchResults(results)
    setIsSearching(false)
  }

  const handleSearch = () => {
    const keyword = searchValue.trim()
    if (!keyword) return

    saveSearchHistory(keyword)
    performSearch(keyword)
  }

  const handleHistoryClick = (keyword: string) => {
    setSearchValue(keyword)
    saveSearchHistory(keyword)
    performSearch(keyword)
    setHasSearched(true)
  }

  const handleClearInput = () => {
    setSearchValue('')
    setSearchResults([])
    setHasSearched(false)
  }

  const handleSelectSpecs = async (dish: DishItem) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' })
      return
    }

    setSelectedDish(dish)
    setSpecQuantity(1)
    setShowSpecModal(true)
    setSpecLoading(true)

    const defaultSpicyGroup: SpecGroup = {
      id: 1,
      name: '辣度',
      is_required: true,
      sort_order: 0,
      options: [
        { id: 1, name: '免辣', price: 0, sort_order: 0 },
        { id: 2, name: '微辣', price: 0, sort_order: 1 },
        { id: 3, name: '中辣', price: 0, sort_order: 2 },
        { id: 4, name: '特辣', price: 2, sort_order: 3 }
      ]
    }

    try {
      const res = await merchantApi.getDishSpecs(dish.id)
      const specsData: DishSpecsData = res.data

      if (specsData.specs && specsData.specs.length > 0) {
        setSpecGroups(specsData.specs)
        const defaultOptions: Record<number, number> = {}
        specsData.specs.forEach((group) => {
          if (group.options.length > 0) {
            defaultOptions[group.id] = group.options[0].id
          }
        })
        setSelectedOptions(defaultOptions)
      } else {
        setSpecGroups([defaultSpicyGroup])
        setSelectedOptions({ [defaultSpicyGroup.id]: defaultSpicyGroup.options[0].id })
      }
    } catch (error) {
      console.error('获取规格失败:', error)
      setSpecGroups([defaultSpicyGroup])
      setSelectedOptions({ [defaultSpicyGroup.id]: defaultSpicyGroup.options[0].id })
    } finally {
      setSpecLoading(false)
    }
  }

  const handleCloseSpecModal = () => {
    setShowSpecModal(false)
    setSelectedDish(null)
    setSpecGroups([])
    setSelectedOptions({})
    setSpecQuantity(1)
  }

  const handleSelectOption = (groupId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: optionId
    }))
  }

  const calcSpecPrice = (): number => {
    if (!selectedDish) return 0
    let basePrice = Number(selectedDish.price)
    specGroups.forEach((group) => {
      const selectedOptionId = selectedOptions[group.id]
      if (selectedOptionId) {
        const option = group.options.find((o) => o.id === selectedOptionId)
        if (option) {
          basePrice += option.price
        }
      }
    })
    return basePrice
  }

  const handleAddToCart = async (dish: DishItem) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' })
      return
    }

    const success = await addToCart({
      dish_id: dish.id,
      quantity: 1
    })
    if (success) {
      Taro.showToast({
        title: `已添加${dish.name}`,
        icon: 'success'
      })
    }
  }

  const handleDishQuantityChange = async (dish: DishItem, newQuantity: number) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' })
      return
    }

    const currentQuantity = getDishQuantity(dish.id)

    if (newQuantity > currentQuantity) {
      await addToCart({
        dish_id: dish.id,
        quantity: 1
      })
    } else if (newQuantity < currentQuantity && newQuantity >= 0) {
      const cartItemsForDish = cartItems.filter((item) => item.dish_id === dish.id)
      if (cartItemsForDish.length > 0) {
        const itemToUpdate = cartItemsForDish[0]
        await updateCartItemQuantity(itemToUpdate.id, newQuantity)
      }
    }
  }

  const handleConfirmAddToCart = async () => {
    if (!selectedDish) return

    const specs: CartAddSpecItem[] = []
    specGroups.forEach((group) => {
      const selectedOptionId = selectedOptions[group.id]
      if (selectedOptionId) {
        const option = group.options.find((o) => o.id === selectedOptionId)
        if (option) {
          specs.push({
            spec_id: group.id,
            spec_name: group.name,
            option_id: option.id,
            option: {
              id: option.id,
              name: option.name,
              price: option.price
            }
          })
        }
      }
    })

    const success = await addToCart({
      dish_id: selectedDish.id,
      quantity: specQuantity,
      specs: specs.length > 0 ? specs : undefined
    })

    if (success) {
      Taro.showToast({
        title: `已添加${selectedDish.name}`,
        icon: 'success'
      })
      handleCloseSpecModal()
    }
  }

  const getCategoryName = (categoryId: number | undefined): string => {
    if (!categoryId) return ''
    const category = categories.find(c => c.id === categoryId)
    return category?.name || ''
  }

  const formatHistoryTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <View className='search-page'>
      <View className='search-header'>
        <View className='search-input-wrapper'>
          <Text className='search-icon'>🔍</Text>
          <Input
            ref={inputRef}
            className='search-input'
            placeholder='搜索菜品名称'
            value={searchValue}
            onInput={(e) => handleInputChange(e.detail.value)}
            onConfirm={handleSearch}
            confirmType='search'
            placeholderClass='search-placeholder'
          />
          {searchValue && (
            <View className='clear-btn' onClick={handleClearInput}>
              <Text className='clear-icon'>×</Text>
            </View>
          )}
        </View>
        <View className='cancel-btn' onClick={() => Taro.navigateBack()}>
          <Text className='cancel-text'>取消</Text>
        </View>
      </View>

      {!hasSearched ? (
        <ScrollView className='search-content' scrollY>
          {searchHistory.length > 0 && (
            <View className='history-section'>
              <View className='section-header'>
                <Text className='section-title'>搜索历史</Text>
                <View className='clear-history-btn' onClick={clearSearchHistory}>
                  <Text className='clear-history-icon'>🗑️</Text>
                  <Text className='clear-history-text'>清空</Text>
                </View>
              </View>
              <View className='history-list'>
                {searchHistory.map((item, index) => (
                  <View
                    key={index}
                    className='history-item'
                    onClick={() => handleHistoryClick(item.keyword)}
                  >
                    <View className='history-left'>
                      <Text className='history-icon'>🕐</Text>
                      <Text className='history-keyword'>{item.keyword}</Text>
                    </View>
                    <Text className='history-time'>{formatHistoryTime(item.time)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {searchHistory.length === 0 && (
            <View className='empty-history'>
              <View className='empty-icon-wrapper'>
                <View className='search-illustration'>
                  <View className='magnifier'>
                    <View className='magnifier-circle'></View>
                    <View className='magnifier-handle'></View>
                  </View>
                  <View className='sparkle sparkle-1'>✨</View>
                  <View className='sparkle sparkle-2'>✨</View>
                </View>
              </View>
              <Text className='empty-title'>搜索你想要的菜品</Text>
              <Text className='empty-desc'>输入菜品名称快速找到心仪美食</Text>
            </View>
          )}

          <View className='bottom-placeholder'></View>
        </ScrollView>
      ) : (
        <ScrollView className='search-results' scrollY>
          {isSearching ? (
            <View className='loading-state'>
              <View className='loading-spinner'></View>
              <Text className='loading-text'>搜索中...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View className='results-list'>
              <View className='results-count'>
                <Text className='count-text'>找到 {searchResults.length} 个相关菜品</Text>
              </View>
              {searchResults.map((dish) => (
                <View key={dish.id} className='dish-card'>
                  <Image
                    className='dish-image'
                    src={dish.image}
                    mode='aspectFill'
                    lazyLoad
                  />
                  <View className='dish-info'>
                    <View className='dish-header'>
                      <Text className='dish-name'>{dish.name}</Text>
                      {dish.category_id && (
                        <View className='category-tag'>
                          <Text className='category-tag-text'>{getCategoryName(dish.category_id)}</Text>
                        </View>
                      )}
                    </View>
                    <View className='price-row'>
                      <Text className='price-symbol'>¥</Text>
                      <Text className='price-value'>{Number(dish.price).toFixed(1)}</Text>
                      <Text className='price-unit'>/{dish.unit}</Text>
                    </View>
                    {dish.has_spec === 1 ? (
                      <View
                        className='specs-btn'
                        onClick={() => handleSelectSpecs(dish)}
                      >
                        <Text className='specs-text'>选规格</Text>
                        {getDishQuantity(dish.id) > 0 && (
                          <View className='dish-badge'>
                            <Text className='badge-num'>{getDishQuantity(dish.id)}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View className='dish-quantity-control'>
                        {getDishQuantity(dish.id) > 0 ? (
                          <>
                            <View
                              className='qty-btn minus'
                              onClick={() => handleDishQuantityChange(dish, getDishQuantity(dish.id) - 1)}
                            >
                              <Text className='qty-icon'>-</Text>
                            </View>
                            <Text className='qty-num'>{getDishQuantity(dish.id)}</Text>
                            <View
                              className='qty-btn plus'
                              onClick={() => handleDishQuantityChange(dish, getDishQuantity(dish.id) + 1)}
                            >
                              <Text className='qty-icon'>+</Text>
                            </View>
                          </>
                        ) : (
                          <View
                            className='add-btn'
                            onClick={() => handleAddToCart(dish)}
                          >
                            <Text className='add-icon'>+</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='no-results'>
              <View className='no-result-icon'>
                <View className='empty-dish'>
                  <View className='plate'></View>
                  <View className='question-mark'>?</View>
                </View>
              </View>
              <Text className='no-result-title'>未找到相关菜品</Text>
              <Text className='no-result-desc'>换个关键词试试吧</Text>
              <View className='suggestion-tags'>
                <Text className='suggestion-hint'>热门搜索：</Text>
                <View className='tag-list'>
                  <View className='suggestion-tag' onClick={() => handleHistoryClick('招牌')}>
                    <Text className='tag-text'>招牌</Text>
                  </View>
                  <View className='suggestion-tag' onClick={() => handleHistoryClick('套餐')}>
                    <Text className='tag-text'>套餐</Text>
                  </View>
                  <View className='suggestion-tag' onClick={() => handleHistoryClick('饮品')}>
                    <Text className='tag-text'>饮品</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          <View className='bottom-placeholder'></View>
        </ScrollView>
      )}

      {showSpecModal && (
        <View className='spec-modal-mask' onClick={handleCloseSpecModal}>
          <View className='spec-modal-content' onClick={(e) => e.stopPropagation()}>
            {selectedDish && (
              <>
                <View className='spec-image-wrapper'>
                  <Image
                    className='spec-dish-image'
                    src={selectedDish.image}
                    mode='aspectFill'
                  />
                  <View className='spec-close-btn' onClick={handleCloseSpecModal}>
                    <Text className='close-icon'>×</Text>
                  </View>
                </View>

                <View className='spec-info'>
                  <Text className='spec-dish-name'>{selectedDish.name}</Text>
                  <Text className='spec-price'>¥{calcSpecPrice().toFixed(1)}</Text>
                </View>

                <View className='spec-options'>
                  {specGroups.map((group) => (
                    <View key={group.id} className='spec-group'>
                      <Text className='spec-label'>{group.name}</Text>
                      <View className='spec-list'>
                        {group.options.map((option) => (
                          <View
                            key={option.id}
                            className={`spec-item ${selectedOptions[group.id] === option.id ? 'active' : ''}`}
                            onClick={() => handleSelectOption(group.id, option.id)}
                          >
                            <Text className='spec-item-name'>{option.name}</Text>
                            {option.price > 0 && (
                              <Text className='spec-item-price'>+¥{option.price}</Text>
                            )}
                            <View className='spec-check'>✓</View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>

                <View className='spec-footer'>
                  <View className='spec-quantity'>
                    <View
                      className='quantity-btn minus'
                      onClick={() => setSpecQuantity(Math.max(1, specQuantity - 1))}
                    >
                      <Text className='quantity-icon'>-</Text>
                    </View>
                    <Text className='quantity-num'>{specQuantity}</Text>
                    <View
                      className='quantity-btn plus'
                      onClick={() => setSpecQuantity(specQuantity + 1)}
                    >
                      <Text className='quantity-icon'>+</Text>
                    </View>
                  </View>
                  <View className='add-cart-btn' onClick={handleConfirmAddToCart}>
                    <Text className='add-cart-text'>加入购物车 ¥{(calcSpecPrice() * specQuantity).toFixed(1)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default DishSearch

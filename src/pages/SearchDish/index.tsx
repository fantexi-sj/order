import { View, Text, Image, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback, useRef } from 'react'
import useMenuStore from '../../store/menu'
import useCartStore from '../../store/cart'
import useCartActions from '../../hooks/useCartActions'
import { merchantApi } from '../../api/merchant'
import type { DishItem, CategoryItem, SpecGroup, DishSpecsData } from '../../types/menu'
import type { CartAddSpecItem } from '../../types/cart'

import './index.scss'

function SearchDish() {
  const { categories } = useMenuStore()
  const { getDishQuantity, items: cartItems } = useCartStore()
  const { addToCart, updateCartItemQuantity } = useCartActions()
  
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<DishItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [hotKeywords, setHotKeywords] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null)
  const [showSpecModal, setShowSpecModal] = useState(false)
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})
  const [specQuantity, setSpecQuantity] = useState(1)
  const [navBarHeight, setNavBarHeight] = useState(0)
  
  const inputRef = useRef<string>(searchValue)

  useEffect(() => {
    initNavBarHeight()
    loadSearchHistory()
    generateHotKeywords()
  }, [categories])

  const initNavBarHeight = () => {
    try {
      const systemInfo = Taro.getSystemInfoSync()
      const menuButton = Taro.getMenuButtonBoundingClientRect()
      const statusBarHeight = systemInfo.statusBarHeight || 0
      const navBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
      setNavBarHeight(navBarHeight)
    } catch (error) {
      console.log('获取导航栏高度失败:', error)
      setNavBarHeight(88)
    }
  }

  const generateHotKeywords = () => {
    const allDishes: DishItem[] = []
    categories.forEach((category: CategoryItem) => {
      if (category.dishes) {
        category.dishes.forEach((dish: DishItem) => {
          if (!allDishes.find(d => d.id === dish.id)) {
            allDishes.push(dish)
          }
        })
      }
    })

    const sortedDishes = [...allDishes].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
    const topDishes = sortedDishes.slice(0, 6).map(dish => dish.name)
    
    if (topDishes.length > 0) {
      setHotKeywords(topDishes)
    } else {
      setHotKeywords(['招牌推荐', '新品上市', '热销榜单', '清爽饮品'])
    }
  }

  const loadSearchHistory = () => {
    try {
      const history = Taro.getStorageSync('search_history')
      if (history && Array.isArray(history)) {
        setSearchHistory(history.slice(0, 10))
      }
    } catch (error) {
      console.log('加载搜索历史失败:', error)
    }
  }

  const saveSearchHistory = (keyword: string) => {
    if (!keyword.trim()) return
    try {
      const newHistory = [keyword, ...searchHistory.filter(item => item !== keyword)].slice(0, 10)
      setSearchHistory(newHistory)
      Taro.setStorageSync('search_history', newHistory)
    } catch (error) {
      console.log('保存搜索历史失败:', error)
    }
  }

  const clearSearchHistory = () => {
    try {
      setSearchHistory([])
      Taro.removeStorageSync('search_history')
      Taro.showToast({ title: '已清空', icon: 'success' })
    } catch (error) {
      console.log('清空搜索历史失败:', error)
    }
  }

  const performSearch = useCallback((keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    const allDishes: DishItem[] = []
    categories.forEach((category: CategoryItem) => {
      if (category.dishes) {
        category.dishes.forEach((dish: DishItem) => {
          if (!allDishes.find(d => d.id === dish.id)) {
            allDishes.push(dish)
          }
        })
      }
    })

    const results = allDishes.filter((dish: DishItem) => 
      dish.name.toLowerCase().includes(keyword.toLowerCase().trim())
    )

    setSearchResults(results)
    setIsSearching(false)
    saveSearchHistory(keyword.trim())
  }, [categories])

  const handleInputChange = (e: any) => {
    const value = e.detail.value
    setSearchValue(value)
    inputRef.current = value
    
    if (value.trim()) {
      performSearch(value)
    } else {
      setSearchResults([])
      setHasSearched(false)
    }
  }

  const handleClearInput = () => {
    setSearchValue('')
    setSearchResults([])
    setHasSearched(false)
  }

  const handleKeywordClick = (keyword: string) => {
    setSearchValue(keyword)
    performSearch(keyword)
  }

  const handleSelectSpecs = async (dish: DishItem) => {
    setSelectedDish(dish)
    setSpecQuantity(1)
    setShowSpecModal(true)

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
    const success = await addToCart({
      dish_id: dish.id,
      quantity: 1
    })
    if (success) {
      Taro.showToast({
        title: `已添加${dish.name}`,
        icon: 'success',
        duration: 1500
      })
    }
  }

  const handleDishQuantityChange = async (dish: DishItem, newQuantity: number) => {
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
        icon: 'success',
        duration: 1500
      })
      handleCloseSpecModal()
    }
  }

  const highlightKeyword = (text: string, keyword: string): any[] => {
    if (!keyword.trim()) return [<Text key="0">{text}</Text>]
    
    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === keyword.toLowerCase() 
        ? <Text key={index} className="highlight-text">{part}</Text>
        : <Text key={index}>{part}</Text>
    )
  }

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c: CategoryItem) => c.id === categoryId)
    return category?.name || ''
  }

  return (
    <View className="search-page">
      <View className="search-header" style={{ paddingTop: `${navBarHeight}rpx` }}>
        <View className="search-input-wrapper">
          <Text className="search-icon">🔍</Text>
          <Input
            className="search-input"
            placeholder="搜索菜品名称"
            value={searchValue}
            onInput={handleInputChange}
            focus
            placeholderClass="search-placeholder"
            confirmType="search"
          />
          {searchValue && (
            <View className="clear-btn" onClick={handleClearInput}>
              <Text className="clear-icon">×</Text>
            </View>
          )}
        </View>
        <View className="cancel-btn" onClick={() => Taro.navigateBack()}>
          <Text className="cancel-text">取消</Text>
        </View>
      </View>

      <ScrollView className="search-content" scrollY>
        {!hasSearched ? (
          <View className="search-suggest">
            {searchHistory.length > 0 && (
              <View className="history-section">
                <View className="section-header">
                  <Text className="section-title">搜索历史</Text>
                  <View className="clear-history-btn" onClick={clearSearchHistory}>
                    <Text className="clear-history-text">清空</Text>
                  </View>
                </View>
                <View className="keyword-list">
                  {searchHistory.map((keyword, index) => (
                    <View
                      key={`history-${index}`}
                      className="keyword-item"
                      onClick={() => handleKeywordClick(keyword)}
                    >
                      <Text className="keyword-text">{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="hot-section">
              <View className="section-header">
                <Text className="section-title">热门搜索</Text>
              </View>
              <View className="keyword-list">
                {hotKeywords.map((keyword, index) => (
                  <View
                    key={`hot-${index}`}
                    className="keyword-item hot"
                    onClick={() => handleKeywordClick(keyword)}
                  >
                    <Text className="keyword-text">{keyword}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View className="search-results">
            {isSearching ? (
              <View className="loading-state">
                <Text className="loading-text">搜索中...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <>
                <View className="result-count">
                  <Text className="count-text">找到 {searchResults.length} 个相关菜品</Text>
                </View>
                <View className="result-list">
                  {searchResults.map((dish) => (
                    <View key={dish.id} className="dish-card">
                      <Image
                        className="dish-image"
                        src={dish.image}
                        mode="aspectFill"
                        lazyLoad
                      />
                      <View className="dish-info">
                        <View className="dish-name-row">
                          <Text className="dish-name">
                            {highlightKeyword(dish.name, searchValue)}
                          </Text>
                        </View>
                        <Text className="dish-category">{getCategoryName(dish.category_id)}</Text>
                        <View className="price-row">
                          <Text className="price-symbol">¥</Text>
                          <Text className="price-value">{Number(dish.price).toFixed(1)}</Text>
                          <Text className="price-unit">/{dish.unit}</Text>
                        </View>
                        {dish.has_spec === 1 ? (
                          <View
                            className="specs-btn"
                            onClick={() => handleSelectSpecs(dish)}
                          >
                            <Text className="specs-text">选规格</Text>
                            {getDishQuantity(dish.id) > 0 && (
                              <View className="dish-badge">
                                <Text className="badge-num">{getDishQuantity(dish.id)}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <View className="dish-quantity-control">
                            {getDishQuantity(dish.id) > 0 ? (
                              <>
                                <View
                                  className="qty-btn minus"
                                  onClick={() => handleDishQuantityChange(dish, getDishQuantity(dish.id) - 1)}
                                >
                                  <Text className="qty-icon">-</Text>
                                </View>
                                <Text className="qty-num">{getDishQuantity(dish.id)}</Text>
                                <View
                                  className="qty-btn plus"
                                  onClick={() => handleDishQuantityChange(dish, getDishQuantity(dish.id) + 1)}
                                >
                                  <Text className="qty-icon">+</Text>
                                </View>
                              </>
                            ) : (
                              <View
                                className="add-btn"
                                onClick={() => handleAddToCart(dish)}
                              >
                                <Text className="add-icon">+</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View className="empty-state">
                <View className="empty-icon-wrapper">
                  <View className="search-empty-icon">
                    <View className="magnifier"></View>
                    <View className="magnifier-handle"></View>
                    <View className="question-mark">?</View>
                  </View>
                </View>
                <Text className="empty-text">未找到相关菜品</Text>
                <Text className="empty-tip">换个关键词试试吧</Text>
              </View>
            )}
          </View>
        )}

        <View className="bottom-placeholder"></View>
      </ScrollView>

      {showSpecModal && (
        <View className="spec-modal-mask" onClick={handleCloseSpecModal}>
          <View className="spec-modal-content" onClick={(e) => e.stopPropagation()}>
            <View className="spec-image-wrapper">
              <Image
                className="spec-dish-image"
                src={selectedDish?.image || ''}
                mode="aspectFill"
              />
              <View className="spec-close-btn" onClick={handleCloseSpecModal}>
                <Text className="close-icon">×</Text>
              </View>
            </View>

            <View className="spec-info">
              <Text className="spec-dish-name">{selectedDish?.name}</Text>
              <Text className="spec-price">¥{calcSpecPrice().toFixed(2)}</Text>
            </View>

            <View className="spec-options">
              {specGroups.map((group) => (
                <View key={group.id} className="spec-group">
                  <Text className="spec-label">{group.name}</Text>
                  <View className="spec-list">
                    {group.options.map((option) => (
                      <View
                        key={option.id}
                        className={`spec-item ${selectedOptions[group.id] === option.id ? 'active' : ''}`}
                        onClick={() => handleSelectOption(group.id, option.id)}
                      >
                        <Text className="spec-item-name">{option.name}</Text>
                        {option.price > 0 && (
                          <Text className="spec-item-price">+¥{option.price}</Text>
                        )}
                        {selectedOptions[group.id] === option.id && (
                          <View className="spec-check">
                            <Text className="check-icon">✓</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View className="spec-footer">
              <View className="spec-quantity">
                <View
                  className="quantity-btn minus"
                  onClick={() => setSpecQuantity(Math.max(1, specQuantity - 1))}
                >
                  <Text className="quantity-icon">-</Text>
                </View>
                <Text className="quantity-num">{specQuantity}</Text>
                <View
                  className="quantity-btn plus"
                  onClick={() => setSpecQuantity(specQuantity + 1)}
                >
                  <Text className="quantity-icon">+</Text>
                </View>
              </View>
              <View className="add-cart-btn" onClick={handleConfirmAddToCart}>
                <Text className="add-cart-text">加入购物车</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default SearchDish

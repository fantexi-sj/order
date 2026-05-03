import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useEffect, useRef, useState, useCallback } from 'react';
import useMenuStore from '../../store/menu';
import useShopStore from '../../store/shop';
import useCartStore from '../../store/cart';
import useCartActions from '../../hooks/useCartActions';
import { merchantApi } from '../../api/merchant';
import { cartApi } from '../../api/cart';
import { storage } from '../../utils/storage';
import { pageCache } from '../../utils/cache';
import type { CategoryItem, DishItem, SpecGroup, DishSpecsData } from '../../types/menu';
import type { CartAddSpecItem } from '../../types/cart';
import type { OrderType } from '../../types/order';
import type { ShopInfo } from '../../types/shop';

import './index.scss';

function BrowseMenuList() {
  const { categories, currentCategoryId, setCurrentCategory, setCategories } = useMenuStore();
  const { setShopInfo, getShopName, getNotice, getFullBusinessTime } = useShopStore();
  const { toggleSelectItem, selectAll, unselectAll, getDishQuantity, getCategoryQuantity, getTotalQuantity, getTotalPrice, items: cartItems } = useCartStore();
  const { fetchCartList, addToCart, updateCartItemQuantity, clearAllCart } = useCartActions();
  const rightScrollViewRef = useRef<any>(null);
  const leftScrollViewRef = useRef<any>(null);
  const [isResting, setIsResting] = useState(false);
  const [showBottomTip, setShowBottomTip] = useState(false);
  const [scrollIntoViewId, setScrollIntoViewId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollTop = useRef(0);
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [specQuantity, setSpecQuantity] = useState(1);
  const [specLoading, setSpecLoading] = useState(false);
  const [showCartPanel, setShowCartPanel] = useState(false);
  const isScrollingByClick = useRef(false);
  const categoryPositions = useRef<{ id: number; top: number }[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const savedScrollTopRef = useRef(0);
  const isModalTransitioning = useRef(false);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const isFetching = useRef(false);

  useEffect(() => {
    fetchInitData();
  }, []);

  useDidShow(() => {
    getOrderType()
    checkShowCartPanel()
    refreshDataInBackground()
  })

  const refreshDataInBackground = async () => {
    if (isFetching.current) return
    isFetching.current = true

    try {
      const [merchantRes, dishRes] = await Promise.all([
        merchantApi.getMerchantInfo(),
        merchantApi.getDishList()
      ])

      if (pageCache.isDifferent('merchant_info', merchantRes.data)) {
        setShopInfo(merchantRes.data)
        pageCache.set('merchant_info', merchantRes.data)
        checkBusinessStatus(merchantRes.data.business_hours)
      }

      if (pageCache.isDifferent('dish_list', dishRes.data)) {
        setCategories(dishRes.data)
        pageCache.set('dish_list', dishRes.data)
      }
    } catch (error) {
      console.error('后台刷新数据失败:', error)
    } finally {
      isFetching.current = false
    }
  }

  const checkShowCartPanel = async () => {
    const shouldShow = await storage.getShowCartPanel()
    if (shouldShow) {
      await storage.removeShowCartPanel()
      setShowCartPanel(true)
    }
  };

  const getOrderType = async () => {
    const type = await storage.getOrderType();
    if (type === 'dine_in' || type === 'takeaway') {
      setOrderType(type);
    }
  };

  const fetchInitData = async () => {
    const cachedMerchant = pageCache.get<ShopInfo>('merchant_info')
    const cachedDishes = pageCache.get<CategoryItem[]>('dish_list')

    if (cachedMerchant && cachedDishes) {
      setShopInfo(cachedMerchant)
      setCategories(cachedDishes)
      checkBusinessStatus(cachedMerchant.business_hours)
      setLoading(false)
      await fetchCartList()
      refreshDataInBackground()
      return
    }

    try {
      setLoading(true);
      const [merchantRes, dishRes] = await Promise.all([
        merchantApi.getMerchantInfo(),
        merchantApi.getDishList()
      ]);

      setShopInfo(merchantRes.data);
      setCategories(dishRes.data);
      checkBusinessStatus(merchantRes.data.business_hours);

      pageCache.set('merchant_info', merchantRes.data);
      pageCache.set('dish_list', dishRes.data);

      await fetchCartList();
    } catch (error) {
      console.error('获取数据失败:', error);
      Taro.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  /** 检查店铺是否在营业时间内 */
  const checkBusinessStatus = (businessHours: string) => {
    if (!businessHours) {
      setIsResting(false);
      return;
    }

    const [startTime, endTime] = businessHours.split('-');
    if (!startTime || !endTime) {
      setIsResting(false);
      return;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (currentTime < startMinutes || currentTime > endMinutes) {
      setIsResting(true);
    } else {
      setIsResting(false);
    }
  };

  /** 点击左侧分类导航切换分类 */
  const handleCategoryClick = (categoryId: number) => {
    setCurrentCategory(categoryId);
    isScrollingByClick.current = true;
    const targetId = `category-${categoryId}`;
    setScrollIntoViewId(targetId);

    setTimeout(() => {
      const query = Taro.createSelectorQuery();
      query.select('.dish-list').scrollOffset((res) => {
        if (res) {
          setScrollTop(res.scrollTop);
        }
      }).exec();
      setScrollIntoViewId('');
      isScrollingByClick.current = false;
    }, 350);
  };

  /** 计算各分类在右侧滚动区域中的位置 */
  const calculateCategoryPositions = useCallback(() => {
    const query = Taro.createSelectorQuery();
    const promises = categories.map((category: CategoryItem) => {
      return new Promise<{ id: number; top: number }>((resolve) => {
        query.select(`#category-${category.id}`).boundingClientRect((rect: any) => {
          if (rect) {
            resolve({ id: category.id, top: rect.top });
          } else {
            resolve({ id: category.id, top: 0 });
          }
        }).exec();
      });
    });

    Promise.all(promises).then((positions) => {
      categoryPositions.current = positions.sort((a, b) => a.top - b.top);
    });
  }, [categories]);

  useEffect(() => {
    if (categories.length > 0) {
      setTimeout(() => {
        calculateCategoryPositions();
      }, 100);
    }
  }, [categories, calculateCategoryPositions]);

  /** 右侧菜品列表滚动时联动左侧分类高亮 */
  const handleScroll = useCallback((e: any) => {
    if (isScrollingByClick.current || isModalTransitioning.current) return;

    const scrollTop = e.detail.scrollTop;
    const scrollViewHeight = e.detail.scrollHeight - e.detail.offsetHeight;

    if (scrollTop >= scrollViewHeight - 50) {
      setShowBottomTip(true);
    } else {
      setShowBottomTip(false);
    }

    if (scrollTop <= 0) {
      setShowHeader(true);
    } else if (scrollTop > lastScrollTop.current && scrollTop > 50) {
      setShowHeader(false);
    }
    lastScrollTop.current = scrollTop;

    const query = Taro.createSelectorQuery();
    query.select('.dish-list').boundingClientRect();
    categories.forEach((category: CategoryItem) => {
      query.select(`#category-${category.id}`).boundingClientRect();
    });
    query.exec((res) => {
      if (!res || !res[0]) return;

      const containerTop = res[0].top;
      let activeCategoryId = categories[0]?.id;

      for (let i = 1; i < res.length; i++) {
        if (res[i] && res[i].top <= containerTop + 120) {
          activeCategoryId = categories[i - 1].id;
        }
      }

      if (currentCategoryId !== activeCategoryId) {
        setCurrentCategory(activeCategoryId);
      }
    });
  }, [categories, currentCategoryId, setCurrentCategory]);

  /** 点击"选规格"按钮，调用后端接口获取规格数据并打开弹窗 */
  const handleSelectSpecs = async (dish: DishItem) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' });
      return;
    }

    savedScrollTopRef.current = lastScrollTop.current;
    setSelectedDish(dish);
    setSpecQuantity(1);
    setShowSpecModal(true);

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
    };

    try {
      const res = await merchantApi.getDishSpecs(dish.id);
      const specsData: DishSpecsData = res.data;

      if (specsData.specs && specsData.specs.length > 0) {
        setSpecGroups(specsData.specs);
        const defaultOptions: Record<number, number> = {};
        specsData.specs.forEach((group) => {
          if (group.options.length > 0) {
            defaultOptions[group.id] = group.options[0].id;
          }
        });
        setSelectedOptions(defaultOptions);
      } else {
        setSpecGroups([defaultSpicyGroup]);
        setSelectedOptions({ [defaultSpicyGroup.id]: defaultSpicyGroup.options[0].id });
      }
    } catch (error) {
      console.error('获取规格失败，使用默认辣度规格:', error);
      setSpecGroups([defaultSpicyGroup]);
      setSelectedOptions({ [defaultSpicyGroup.id]: defaultSpicyGroup.options[0].id });
    } finally {
      setSpecLoading(false);
    }
  };

  /** 关闭规格选择弹窗 */
  const handleCloseSpecModal = () => {
    isModalTransitioning.current = true;
    setShowSpecModal(false);
    setSelectedDish(null);
    setSpecGroups([]);
    setSelectedOptions({});
    setSpecQuantity(1);
    setScrollTop(savedScrollTopRef.current);
    setTimeout(() => {
      isModalTransitioning.current = false;
    }, 400);
  };

  /** 选择某个规格组中的选项 */
  const handleSelectOption = (groupId: number, optionId: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: optionId
    }));
  };

  /** 计算规格弹窗中的预估价格（菜品原价 + 规格加价之和） */
  const calcSpecPrice = (): number => {
    if (!selectedDish) return 0;
    let basePrice = Number(selectedDish.price);
    specGroups.forEach((group) => {
      const selectedOptionId = selectedOptions[group.id];
      if (selectedOptionId) {
        const option = group.options.find((o) => o.id === selectedOptionId);
        if (option) {
          basePrice += option.price;
        }
      }
    });
    return basePrice;
  };

  /** 无规格菜品直接添加到购物车 */
  const handleAddToCart = async (dish: DishItem) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' });
      return;
    }

    const success = await addToCart({
      dish_id: dish.id,
      quantity: 1
    });
    if (success) {
      Taro.showToast({
        title: `已添加${dish.name}`,
        icon: 'success'
      });
    }
  };

  /** 无规格菜品数量变化（加号/减号按钮） */
  const handleDishQuantityChange = async (dish: DishItem, newQuantity: number) => {
    if (isResting) {
      Taro.showToast({ title: '本店已休息', icon: 'none' });
      return;
    }

    const currentQuantity = getDishQuantity(dish.id);

    if (newQuantity > currentQuantity) {
      await addToCart({
        dish_id: dish.id,
        quantity: 1
      });
    } else if (newQuantity < currentQuantity && newQuantity >= 0) {
      const cartItemsForDish = cartItems.filter((item) => item.dish_id === dish.id);
      if (cartItemsForDish.length > 0) {
        const itemToUpdate = cartItemsForDish[0];
        if (newQuantity === 0) {
          await updateCartItemQuantity(itemToUpdate.id, 0);
        } else {
          await updateCartItemQuantity(itemToUpdate.id, newQuantity);
        }
      }
    }
  };

  /** 规格弹窗确认添加到购物车 */
  const handleConfirmAddToCart = async () => {
    if (!selectedDish) return;

    const specs: CartAddSpecItem[] = [];
    specGroups.forEach((group) => {
      const selectedOptionId = selectedOptions[group.id];
      if (selectedOptionId) {
        const option = group.options.find((o) => o.id === selectedOptionId);
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
          });
        }
      }
    });

    const success = await addToCart({
      dish_id: selectedDish.id,
      quantity: specQuantity,
      specs: specs.length > 0 ? specs : undefined
    });

    if (success) {
      Taro.showToast({
        title: `已添加${selectedDish.name}`,
        icon: 'success'
      });
      handleCloseSpecModal();
    }
  };

  /** 购物车面板中修改商品数量 */
  const handleUpdateCartQuantity = async (itemId: number, quantity: number) => {
    await updateCartItemQuantity(itemId, quantity);
  };

  /** 清空购物车 */
  const handleClearCart = async () => {
    await clearAllCart();
    isModalTransitioning.current = true;
    setShowCartPanel(false);
    setScrollTop(savedScrollTopRef.current);
    setTimeout(() => {
      isModalTransitioning.current = false;
    }, 400);
  };

  /** 点击去支付，调用结算接口并跳转到结算页面 */
  const handleGoToPay = async () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }

    const cartIds = selectedItems.map((item) => item.id);

    try {
      Taro.showLoading({ title: '加载中...' });
      await cartApi.getCheckout(cartIds);
      Taro.hideLoading();

      Taro.navigateTo({
        url: `/pages/PlaceAnOrderPayment/index?cart_ids=${cartIds.join(',')}`
      });
    } catch (error) {
      Taro.hideLoading();
      console.error('获取结算信息失败:', error);
      Taro.showToast({ title: '获取结算信息失败', icon: 'none' });
    }
  };

  /** 生成购物车商品的规格文字描述 */
  const getCartItemSpecText = (item: typeof cartItems[0]): string => {
    if (!item.specs || item.specs.length === 0) return '默认';
    return item.specs.map((s) => s.option.name).join('/');
  };

  return (
    <View className='menu-container'>
      {/* 顶部搜索栏 */}
      <View className={`shop-header ${showHeader ? 'show' : 'hide'}`}>
        <View className='search-bar' onClick={() => Taro.navigateTo({ url: '/pages/SearchDish/index' })}>
          <Text className='search-icon'>🔍</Text>
          <Text className='search-placeholder'>搜一搜</Text>
        </View>
      </View>

      {/* 店铺详情 */}
      <View className={`shop-info ${showHeader ? 'show' : 'hide'}`}>
        <View className='shop-name-row'>
          <Text className='shop-name'>{getShopName()}</Text>
          <View className='pickup-btn'>
            <Text className='pickup-text'>{orderType === 'dine_in' ? '堂食' : '自取'}</Text>
          </View>
        </View>
        <Text className='distance-text'>距离您88m</Text>
        <View className={`notice-row ${showNoticeDropdown ? 'expanded' : ''}`}>
          <View className='notice-left'>
            <Text className='notice-icon'>📢</Text>
            <View className={`notice-content ${showNoticeDropdown ? 'expanded' : ''}`}>
              <Text className='notice-rating'></Text>
              <Text className='notice-desc'>{getNotice()}</Text>
            </View>
          </View>
          <Text 
            className='more-btn'
            onClick={() => setShowNoticeDropdown(!showNoticeDropdown)}
          >
            {showNoticeDropdown ? '隐藏 ∧' : '更多 ∨'}
          </Text>
        </View>
      </View>

      {/* 会员提示条 */}
      <View className={`member-banner ${showHeader ? 'show' : 'hide'}`}>
        <View className='member-left'>
          <Text className='crown-icon'>👑</Text>
          <Text className='member-text'>注册/登录会员，享更多专属权益</Text>
        </View>
        <View className='member-right'>
          <Text className='coupon-btn'>领取优惠 →</Text>
        </View>
      </View>

      {/* 主内容区 - 左右分栏 */}
      <View className={`main-content ${!showHeader ? 'header-hidden' : ''}`}>
        {loading ? (
          <View className='loading-container'>
            <Text className='loading-text'>加载中...</Text>
          </View>
        ) : categories.length === 0 ? (
          <View className='empty-container'>
            <Text className='empty-text'>暂无菜品数据</Text>
          </View>
        ) : (
          <>
            {/* 左侧分类导航 */}
            <ScrollView
              ref={leftScrollViewRef}
              className='category-nav'
              scrollY
              scrollWithAnimation
            >
              {categories.map((category: CategoryItem) => (
                <View
                  key={category.id}
                  className={`category-item ${currentCategoryId === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <Text className='category-name'>{category.name}</Text>
                  {getCategoryQuantity(category.id) > 0 && (
                    <View className='category-badge'>
                      <Text className='badge-num'>{getCategoryQuantity(category.id)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* 右侧菜品列表 - 所有分类连续显示 */}
            <ScrollView
              ref={rightScrollViewRef}
              className='dish-list'
              scrollY
              scrollWithAnimation
              scrollTop={scrollTop}
              scrollIntoView={scrollIntoViewId || undefined}
              onScroll={handleScroll}
              enhanced
              showScrollbar={false}
            >
              {categories.map((category: CategoryItem) => (
                <View
                  key={category.id}
                  id={`category-${category.id}`}
                  className='category-section'
                >
                  {/* 分类标题 */}
                  <View className='section-header'>
                    <Text className='section-title'>{category.name}</Text>
                  </View>

                  {/* 菜品列表 */}
                  {category.dishes && category.dishes.map((dish: DishItem) => (
                    <View key={dish.id} className='dish-card'>
                      <Image
                        className='dish-image'
                        src={dish.image}
                        mode='aspectFill'
                        lazyLoad
                      />
                      <View className='dish-info'>
                          <Text className='dish-name'>{dish.name}</Text>
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
              ))}

              {/* 已经到底了提示 */}
              <View className={`bottom-tip ${showBottomTip ? 'show' : ''}`}>
                <View className='tip-line'></View>
                <Text className='tip-text'>已经到底了</Text>
                <View className='tip-line'></View>
              </View>

              {/* 底部占位，防止被TabBar遮挡 */}
              <View className='bottom-spacer'></View>
            </ScrollView>
          </>
        )}
      </View>

      {/* 底部营业状态 - 仅在休息时间显示 */}
      {isResting && (
        <View className='footer-status'>
          <Text className='status-text'>本店已休息</Text>
          <Text className='time-text'>本店营业时间：{getFullBusinessTime()}</Text>
        </View>
      )}

      {/* 规格选择弹窗 */}
      {showSpecModal && selectedDish && (
        <View className='spec-modal-mask' catchMove onClick={handleCloseSpecModal}>
          <View className='spec-modal-content' onClick={(e) => e.stopPropagation()}>
            {/* 顶部图片区域 */}
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

            {/* 菜品信息区域 */}
            <View className='spec-info'>
              <Text className='spec-dish-name'>{selectedDish.name}</Text>
              <Text className='spec-price'>¥{calcSpecPrice().toFixed(1)}</Text>
            </View>

            {/* 规格选择区域 */}
            <View className='spec-options'>
              {specLoading ? (
                <Text className='spec-label'>加载中...</Text>
              ) : (
                specGroups.map((group) => (
                  <View key={group.id} style={{ marginBottom: '24rpx' }}>
                    <Text className='spec-label'>{group.name}{group.is_required ? '（必选）' : '（可选）'}</Text>
                    <View className='spec-list'>
                      {group.options.map((option) => (
                        <View
                          key={option.id}
                          className={`spec-item ${selectedOptions[group.id] === option.id ? 'active' : ''}`}
                          onClick={() => handleSelectOption(group.id, option.id)}
                        >
                          <Text className={`spec-item-name ${selectedOptions[group.id] === option.id ? 'active' : ''}`}>
                            {option.name}{option.price > 0 ? ` +¥${option.price}` : ''}
                          </Text>
                          {selectedOptions[group.id] === option.id && (
                            <Text className='spec-check'>✓</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* 底部操作栏 */}
            <View className='spec-footer'>
              <View className='spec-quantity'>
                <View
                  className='quantity-btn minus'
                  onClick={() => setSpecQuantity((prev) => Math.max(1, prev - 1))}
                >
                  <Text className='quantity-icon'>-</Text>
                </View>
                <Text className='quantity-num'>{specQuantity}</Text>
                <View
                  className='quantity-btn plus'
                  onClick={() => setSpecQuantity((prev) => prev + 1)}
                >
                  <Text className='quantity-icon'>+</Text>
                </View>
              </View>
              <View
                className='add-cart-btn'
                onClick={handleConfirmAddToCart}
              >
                <Text className='add-cart-text'>添加至购物车</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 购物车底部栏 */}
      {cartItems.length > 0 && (
        <>
          <View className={`cart-bar ${showCartPanel ? 'expanded' : ''}`}>
            <View
              className='cart-left-area'
              onClick={() => {
                if (!showCartPanel) {
                  savedScrollTopRef.current = lastScrollTop.current;
                } else {
                  isModalTransitioning.current = true;
                  setScrollTop(savedScrollTopRef.current);
                  setTimeout(() => {
                    isModalTransitioning.current = false;
                  }, 400);
                }
                setShowCartPanel(!showCartPanel);
              }}
            >
              <View className='cart-icon-wrapper'>
                <View className='cart-icon'>
                  <Text className='cart-icon-text'>🛒</Text>
                  {getTotalQuantity() > 0 && (
                    <View className='cart-badge'>
                      <Text className='badge-num'>{getTotalQuantity()}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View className='cart-price-info'>
                <Text className='cart-total-price'>¥{getTotalPrice().toFixed(2)}</Text>
              </View>
            </View>
            <View className='cart-pay-btn' onClick={handleGoToPay}>
              <Text className='cart-pay-text'>去支付</Text>
            </View>
          </View>

          {/* 购物车展开面板 */}
          {showCartPanel && (
            <View className='cart-panel-mask' catchMove onClick={() => {
              isModalTransitioning.current = true;
              setShowCartPanel(false);
              setScrollTop(savedScrollTopRef.current);
              setTimeout(() => {
                isModalTransitioning.current = false;
              }, 400);
            }}>
              <View className='cart-panel-content' onClick={(e) => e.stopPropagation()}>
                <View className='cart-panel-header'>
                  <View
                    className='select-all-btn'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cartItems.every(item => item.selected)) {
                        unselectAll();
                      } else {
                        selectAll();
                      }
                    }}
                  >
                    <View className={`checkbox ${cartItems.every(item => item.selected) ? 'checked' : ''}`}>
                      {cartItems.every(item => item.selected) && <Text className='check-mark'>✓</Text>}
                    </View>
                    <Text className='select-all-text'>全选</Text>
                  </View>
                  <View
                    className='clear-cart-btn'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCart();
                    }}
                  >
                    <Text className='clear-cart-text'>清空</Text>
                  </View>
                </View>

                <ScrollView className='cart-item-list' scrollY>
                  {cartItems.map((item) => (
                    <View key={item.id} className='cart-item'>
                      <View
                        className='item-checkbox-wrapper'
                        onClick={() => toggleSelectItem(item.id)}
                      >
                        <View className={`checkbox ${item.selected ? 'checked' : ''}`}>
                          {item.selected && <Text className='check-mark'>✓</Text>}
                        </View>
                      </View>
                      <Image className='item-image' src={item.dish_image} mode='aspectFill' />
                      <View className='item-info'>
                        <Text className='item-name'>{item.dish_name}</Text>
                        <Text className='item-spec'>{getCartItemSpecText(item)}</Text>
                        <View className='item-bottom'>
                          <Text className='item-price'>¥{item.unit_price.toFixed(2)}</Text>
                          <View className='item-quantity-control'>
                            <View
                              className='qty-btn minus'
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                            >
                              <Text className='qty-icon'>-</Text>
                            </View>

                            <Text className='qty-num'>{item.quantity}</Text>
                            <View
                              className='qty-btn plus'
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                            >
                              <Text className='qty-icon'>+</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <View className='cart-panel-footer'>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default BrowseMenuList;

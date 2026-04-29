import Taro from '@tarojs/taro'
import useCartStore from '../store/cart'
import useMenuStore from '../store/menu'
import { cartApi } from '../api/cart'
import type { CartAddParams, CartItem } from '../types/cart'
import { auth } from '../utils/auth'

const useCartActions = () => {
  const { setItems, setSummary, clearCart } = useCartStore()
  const { categories } = useMenuStore()

  const findCategoryIdByDishId = (dishId: number): number | undefined => {
    for (const category of categories) {
      const found = category.dishes.find((dish) => dish.id === dishId)
      if (found) return category.id
    }
    return undefined
  }

  const enrichCartItems = (items: CartItem[]): CartItem[] => {
    return items.map((item) => ({
      ...item,
      category_id: findCategoryIdByDishId(item.dish_id),
      selected: true
    }))
  }

  const fetchCartList = async () => {
    try {
      const isLoggedIn = await auth.checkLogin()
      if (!isLoggedIn) return

      const res = await cartApi.getCartList()
      const enrichedItems = enrichCartItems(res.data.items)
      setItems(enrichedItems)
      setSummary(res.data.summary)
    } catch (error) {
      console.error('获取购物车失败:', error)
    }
  }

  const addToCart = async (params: CartAddParams): Promise<boolean> => {
    try {
      const isLoggedIn = await auth.checkLogin()
      if (!isLoggedIn) {
        Taro.showToast({ title: '请先登录', icon: 'none' })
        return false
      }

      await cartApi.addToCart(params)
      await fetchCartList()
      return true
    } catch (error) {
      console.error('添加购物车失败:', error)
      Taro.showToast({ title: '添加失败', icon: 'none' })
      return false
    }
  }

  const updateCartItemQuantity = async (id: number, quantity: number): Promise<boolean> => {
    try {
      if (quantity <= 0) {
        return await removeCartItem(id)
      }

      await cartApi.updateQuantity(id, quantity)
      await fetchCartList()
      return true
    } catch (error) {
      console.error('更新数量失败:', error)
      Taro.showToast({ title: '更新失败', icon: 'none' })
      return false
    }
  }

  const removeCartItem = async (id: number): Promise<boolean> => {
    try {
      await cartApi.removeCartItem(id)
      await fetchCartList()
      return true
    } catch (error) {
      console.error('删除商品失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
      return false
    }
  }

  const clearAllCart = async (): Promise<boolean> => {
    try {
      const items = useCartStore.getState().items
      for (const item of items) {
        await cartApi.removeCartItem(item.id)
      }
      clearCart()
      return true
    } catch (error) {
      console.error('清空购物车失败:', error)
      Taro.showToast({ title: '清空失败', icon: 'none' })
      return false
    }
  }

  return {
    fetchCartList,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearAllCart
  }
}

export default useCartActions

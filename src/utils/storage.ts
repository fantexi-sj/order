import Taro from '@tarojs/taro'

const TOKEN_KEY = 'token'
const OPENID_KEY = 'openid'
const USER_INFO_KEY = 'userInfo'
const ORDER_TYPE_KEY = 'orderType'
const SHOW_CART_PANEL_KEY = 'showCartPanel'

export const storage = {
  setToken: async (token: string): Promise<void> => {
    await Taro.setStorage({ key: TOKEN_KEY, data: token })
  },

  getToken: async (): Promise<string | null> => {
    try {
      const res = await Taro.getStorage({ key: TOKEN_KEY })
      return res.data || null
    } catch {
      return null
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await Taro.removeStorage({ key: TOKEN_KEY })
    } catch (error) {
      console.error('移除 token 失败:', error)
    }
  },

  setOpenid: async (openid: string): Promise<void> => {
    await Taro.setStorage({ key: OPENID_KEY, data: openid })
  },

  getOpenid: async (): Promise<string | null> => {
    try {
      const res = await Taro.getStorage({ key: OPENID_KEY })
      return res.data || null
    } catch {
      return null
    }
  },

  removeOpenid: async (): Promise<void> => {
    try {
      await Taro.removeStorage({ key: OPENID_KEY })
    } catch (error) {
      console.error('移除 openid 失败:', error)
    }
  },

  setUserInfo: async (userInfo: any): Promise<void> => {
    await Taro.setStorage({ key: USER_INFO_KEY, data: userInfo })
  },

  getUserInfo: async (): Promise<any | null> => {
    try {
      const res = await Taro.getStorage({ key: USER_INFO_KEY })
      return res.data || null
    } catch {
      return null
    }
  },

  removeUserInfo: async (): Promise<void> => {
    try {
      await Taro.removeStorage({ key: USER_INFO_KEY })
    } catch (error) {
      console.error('移除用户信息失败:', error)
    }
  },

  clearAll: async (): Promise<void> => {
    await storage.removeToken()
    await storage.removeOpenid()
    await storage.removeUserInfo()
  },

  setOrderType: async (orderType: string): Promise<void> => {
    await Taro.setStorage({ key: ORDER_TYPE_KEY, data: orderType })
  },

  getOrderType: async (): Promise<string | null> => {
    try {
      const res = await Taro.getStorage({ key: ORDER_TYPE_KEY })
      return res.data || null
    } catch {
      return null
    }
  },

  removeOrderType: async (): Promise<void> => {
    try {
      await Taro.removeStorage({ key: ORDER_TYPE_KEY })
    } catch (error) {
      console.error('移除订单类型失败:', error)
    }
  },

  setShowCartPanel: async (show: boolean): Promise<void> => {
    await Taro.setStorage({ key: SHOW_CART_PANEL_KEY, data: show })
  },

  getShowCartPanel: async (): Promise<boolean> => {
    try {
      const res = await Taro.getStorage({ key: SHOW_CART_PANEL_KEY })
      return res.data === true
    } catch {
      return false
    }
  },

  removeShowCartPanel: async (): Promise<void> => {
    try {
      await Taro.removeStorage({ key: SHOW_CART_PANEL_KEY })
    } catch (error) {
      console.error('移除购物车弹窗标记失败:', error)
    }
  }
}

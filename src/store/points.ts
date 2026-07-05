import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type {
  PointsMallState,
  PointsProduct,
  PointsProductDetail,
  ExchangeLog,
  ExchangeLogDetail,
  PointLog,
  Pagination,
  ExchangeResult
} from '../types/points'
import { pointsApi } from '../api/points'

const PAGE_SIZE = 10

const defaultPagination: Pagination = {
  page: 1,
  page_size: PAGE_SIZE,
  total: 0,
  total_pages: 0
}

const usePointsMallStore = create<PointsMallState>((set, get) => ({
  products: [],
  productPagination: defaultPagination,
  productLoading: false,
  currentProduct: null,
  userPoints: 0,

  exchangeLogs: [],
  exchangeLogPagination: defaultPagination,
  exchangeLogLoading: false,
  currentExchangeLog: null,

  pointLogs: [],
  pointLogPagination: defaultPagination,
  pointLogLoading: false,

  setProducts: (products: PointsProduct[]) => {
    set({ products })
  },

  appendProducts: (newProducts: PointsProduct[]) => {
    set((state) => ({
      products: [...state.products, ...newProducts]
    }))
  },

  setProductPagination: (pagination: Pagination) => {
    set({ productPagination: pagination })
  },

  setProductLoading: (loading: boolean) => {
    set({ productLoading: loading })
  },

  setCurrentProduct: (product: PointsProductDetail | null) => {
    set({ currentProduct: product })
  },

  setUserPoints: (points: number) => {
    set({ userPoints: points })
  },

  setExchangeLogs: (logs: ExchangeLog[]) => {
    set({ exchangeLogs: logs })
  },

  appendExchangeLogs: (newLogs: ExchangeLog[]) => {
    set((state) => ({
      exchangeLogs: [...state.exchangeLogs, ...newLogs]
    }))
  },

  setExchangeLogPagination: (pagination: Pagination) => {
    set({ exchangeLogPagination: pagination })
  },

  setExchangeLogLoading: (loading: boolean) => {
    set({ exchangeLogLoading: loading })
  },

  setCurrentExchangeLog: (log: ExchangeLogDetail | null) => {
    set({ currentExchangeLog: log })
  },

  setPointLogs: (logs: PointLog[]) => {
    set({ pointLogs: logs })
  },

  appendPointLogs: (newLogs: PointLog[]) => {
    set((state) => ({
      pointLogs: [...state.pointLogs, ...newLogs]
    }))
  },

  setPointLogPagination: (pagination: Pagination) => {
    set({ pointLogPagination: pagination })
  },

  setPointLogLoading: (loading: boolean) => {
    set({ pointLogLoading: loading })
  },

  fetchProductList: async (page: number, isRefresh: boolean = false) => {
    const { productLoading, productPagination } = get()
    if (productLoading) return

    if (!isRefresh && productPagination.total > 0) {
      const loadedCount = (page - 1) * PAGE_SIZE
      if (loadedCount >= productPagination.total) {
        return
      }
    }

    try {
      set({ productLoading: true })
      const response = await pointsApi.getProductList({
        page,
        page_size: PAGE_SIZE
      })

      if (response.code === 200 && response.data) {
        const { list, pagination } = response.data

        if (isRefresh || page === 1) {
          set({ products: list, productPagination: pagination })
        } else {
          set((state) => ({
            products: [...state.products, ...list],
            productPagination: pagination
          }))
        }
      }
    } catch (error) {
      console.error('加载商品列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      set({ productLoading: false })
    }
  },

  exchangeProduct: async (productId: number): Promise<ExchangeResult | null> => {
    try {
      const response = await pointsApi.exchange(productId)

      if (response.code === 200 && response.data) {
        set({ userPoints: response.data.remain_points })
        return response.data
      }
      return null
    } catch (error: any) {
      console.error('兑换失败:', error)
      throw error
    }
  },

  fetchExchangeLogList: async (page: number, isRefresh: boolean = false) => {
    const { exchangeLogLoading, exchangeLogPagination } = get()
    if (exchangeLogLoading) return

    if (!isRefresh && exchangeLogPagination.total > 0) {
      const loadedCount = (page - 1) * PAGE_SIZE
      if (loadedCount >= exchangeLogPagination.total) {
        return
      }
    }

    try {
      set({ exchangeLogLoading: true })
      const response = await pointsApi.getExchangeLogList({
        page,
        page_size: PAGE_SIZE
      })

      if (response.code === 200 && response.data) {
        const { list, pagination } = response.data

        if (isRefresh || page === 1) {
          set({ exchangeLogs: list, exchangeLogPagination: pagination })
        } else {
          set((state) => ({
            exchangeLogs: [...state.exchangeLogs, ...list],
            exchangeLogPagination: pagination
          }))
        }
      }
    } catch (error) {
      console.error('加载兑换记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      set({ exchangeLogLoading: false })
    }
  },

  fetchExchangeLogDetail: async (id: number) => {
    try {
      const response = await pointsApi.getExchangeLogDetail(id)

      if (response.code === 200 && response.data) {
        set({ currentExchangeLog: response.data })
      }
    } catch (error) {
      console.error('加载兑换详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  resetProductList: () => {
    set({
      products: [],
      productPagination: defaultPagination,
      productLoading: false
    })
  },

  resetExchangeLogList: () => {
    set({
      exchangeLogs: [],
      exchangeLogPagination: defaultPagination,
      exchangeLogLoading: false
    })
  },

  resetPointLogList: () => {
    set({
      pointLogs: [],
      pointLogPagination: defaultPagination,
      pointLogLoading: false
    })
  }
}))

export default usePointsMallStore

import { create } from 'zustand'
import type { Order, OrderStatus, OrderPagination } from '../types/order'

interface OrderStoreState {
  orderList: Order[]
  pagination: OrderPagination
  currentOrder: Order | null
  currentStatus: OrderStatus | undefined

  setOrderList: (list: Order[]) => void
  setPagination: (pagination: OrderPagination) => void
  setCurrentOrder: (order: Order | null) => void
  setCurrentStatus: (status: OrderStatus | undefined) => void
  prependOrder: (order: Order) => void
  updateOrderInList: (orderId: number, updates: Partial<Order>) => void
  removeOrderFromList: (orderId: number) => void
  clearOrderList: () => void
}

const defaultPagination: OrderPagination = {
  page: 1,
  page_size: 10,
  total: 0,
  total_pages: 0
}

const useOrderStore = create<OrderStoreState>((set, get) => ({
  orderList: [],
  pagination: defaultPagination,
  currentOrder: null,
  currentStatus: undefined,

  setOrderList: (list: Order[]) => {
    set({ orderList: list })
  },

  setPagination: (pagination: OrderPagination) => {
    set({ pagination })
  },

  setCurrentOrder: (order: Order | null) => {
    set({ currentOrder: order })
  },

  setCurrentStatus: (status: OrderStatus | undefined) => {
    set({ currentStatus: status })
  },

  prependOrder: (order: Order) => {
    set((state) => ({
      orderList: [order, ...state.orderList],
      pagination: {
        ...state.pagination,
        total: state.pagination.total + 1
      }
    }))
  },

  updateOrderInList: (orderId: number, updates: Partial<Order>) => {
    set((state) => ({
      orderList: state.orderList.map((order) =>
        order.id === orderId ? { ...order, ...updates } : order
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder
    }))
  },

  removeOrderFromList: (orderId: number) => {
    set((state) => ({
      orderList: state.orderList.filter((order) => order.id !== orderId),
      pagination: {
        ...state.pagination,
        total: Math.max(0, state.pagination.total - 1)
      }
    }))
  },

  clearOrderList: () => {
    set({ orderList: [], pagination: defaultPagination, currentOrder: null })
  }
}))

export default useOrderStore

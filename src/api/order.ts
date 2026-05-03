import request from '../utils/request'
import type {
  OrderCreateParams,
  OrderCreateResponse,
  OrderListParams,
  OrderListData,
  OrderDetailData,
  OrderPayResponse
} from '../types/order'

const MERCHANT_ID = 1

export const orderApi = {
  createOrder: (data: Omit<OrderCreateParams, 'merchant_id'>) => {
    return request.post<OrderCreateResponse>('/order/create', {
      merchant_id: MERCHANT_ID,
      ...data
    })
  },

  getOrderList: (params: Omit<OrderListParams, 'merchant_id'>) => {
    const requestParams: Record<string, any> = {
      merchant_id: MERCHANT_ID
    }
    if (params.status !== undefined) {
      requestParams.status = params.status
    }
    if (params.page !== undefined) {
      requestParams.page = params.page
    }
    if (params.page_size !== undefined) {
      requestParams.page_size = params.page_size
    }
    return request.get<OrderListData>('/order/list', requestParams)
  },

  getOrderDetail: (id: number) => {
    return request.get<OrderDetailData>(`/order/detail/${id}`)
  },

  cancelOrder: (id: number) => {
    return request.put<null>(`/order/cancel/${id}`)
  },

  payOrder: (id: number) => {
    return request.put<OrderPayResponse>(`/order/pay/${id}`)
  }
}

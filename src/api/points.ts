import request from '../utils/request'
import type {
  PointsProductListData,
  PointsProductDetail,
  ExchangeResult,
  ExchangeLogListData,
  ExchangeLogDetail,
  PointLogListData,
  ExchangeStatus,
  PointLogType
} from '../types/points'

const MERCHANT_ID = 1

export interface GetProductListParams {
  page?: number
  page_size?: number
}

export interface GetExchangeLogListParams {
  status?: ExchangeStatus
  page?: number
  page_size?: number
}

export interface GetPointLogListParams {
  type?: PointLogType
  page?: number
  page_size?: number
}

export const pointsApi = {
  getProductList: (params: GetProductListParams = {}) => {
    const requestParams: Record<string, any> = {
      merchant_id: MERCHANT_ID
    }
    if (params.page !== undefined) {
      requestParams.page = params.page
    }
    if (params.page_size !== undefined) {
      requestParams.page_size = params.page_size
    }
    return request.get<PointsProductListData>('/point-mall/products', requestParams)
  },

  getProductDetail: (id: number) => {
    return request.get<PointsProductDetail>(`/point-mall/products/${id}`, {
      merchant_id: MERCHANT_ID
    })
  },

  exchange: (productId: number) => {
    return request.post<ExchangeResult>('/point-mall/exchange', {
      merchant_id: MERCHANT_ID,
      product_id: productId
    })
  },

  getExchangeLogList: (params: GetExchangeLogListParams = {}) => {
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
    return request.get<ExchangeLogListData>('/point-mall/exchange/logs', requestParams)
  },

  getExchangeLogDetail: (id: number) => {
    return request.get<ExchangeLogDetail>(`/point-mall/exchange/${id}`, {
      merchant_id: MERCHANT_ID
    })
  },

  getPointLogList: (params: GetPointLogListParams = {}) => {
    const requestParams: Record<string, any> = {
      merchant_id: MERCHANT_ID
    }
    if (params.type !== undefined) {
      requestParams.type = params.type
    }
    if (params.page !== undefined) {
      requestParams.page = params.page
    }
    if (params.page_size !== undefined) {
      requestParams.page_size = params.page_size
    }
    return request.get<PointLogListData>('/point-mall/point-logs', requestParams)
  }
}

export interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface PointsProduct {
  id: number
  name: string
  image: string
  dish_id: number | null
  dish_name: string | null
  dish_price: number | null
  points: number
  stock: number
  limit_num: number
  status: number
}

export interface PointsProductDetail extends PointsProduct {
  dish_description: string | null
  user_points: number
  can_exchange: boolean
}

export interface PointsProductListData {
  list: PointsProduct[]
  pagination: Pagination
}

export interface ExchangeResult {
  exchange_id: number
  exchange_no: string
  product_name: string
  points: number
  expire_at: string
  remain_points: number
}

export interface ExchangeLog {
  id: number
  product_id: number
  product_name: string
  product_image: string
  dish_id: number | null
  dish_name: string | null
  points: number
  status: number
  status_text: string
  used_at: string | null
  expire_at: string
  created_at: string
}

export interface ExchangeLogListData {
  list: ExchangeLog[]
  pagination: Pagination
}

export interface ExchangeLogDetail extends ExchangeLog {
  exchange_no: string
  dish_price: number | null
}

export interface PointLog {
  id: number
  type: number
  type_text: string
  points: number
  balance: number
  related_id: number | null
  related_type: string | null
  remark: string
  created_at: string
}

export interface PointLogListData {
  list: PointLog[]
  pagination: Pagination
}

export interface PointsMallState {
  products: PointsProduct[]
  productPagination: Pagination
  productLoading: boolean
  currentProduct: PointsProductDetail | null
  userPoints: number
  
  exchangeLogs: ExchangeLog[]
  exchangeLogPagination: Pagination
  exchangeLogLoading: boolean
  currentExchangeLog: ExchangeLogDetail | null
  
  pointLogs: PointLog[]
  pointLogPagination: Pagination
  pointLogLoading: boolean
  
  setProducts: (products: PointsProduct[]) => void
  appendProducts: (products: PointsProduct[]) => void
  setProductPagination: (pagination: Pagination) => void
  setProductLoading: (loading: boolean) => void
  setCurrentProduct: (product: PointsProductDetail | null) => void
  setUserPoints: (points: number) => void
  
  setExchangeLogs: (logs: ExchangeLog[]) => void
  appendExchangeLogs: (logs: ExchangeLog[]) => void
  setExchangeLogPagination: (pagination: Pagination) => void
  setExchangeLogLoading: (loading: boolean) => void
  setCurrentExchangeLog: (log: ExchangeLogDetail | null) => void
  
  setPointLogs: (logs: PointLog[]) => void
  appendPointLogs: (logs: PointLog[]) => void
  setPointLogPagination: (pagination: Pagination) => void
  setPointLogLoading: (loading: boolean) => void
  
  fetchProductList: (page: number, isRefresh?: boolean) => Promise<void>
  exchangeProduct: (productId: number) => Promise<ExchangeResult | null>
  fetchExchangeLogList: (page: number, isRefresh?: boolean) => Promise<void>
  fetchExchangeLogDetail: (id: number) => Promise<void>
  
  resetProductList: () => void
  resetExchangeLogList: () => void
  resetPointLogList: () => void
}

export type ExchangeStatus = 1 | 2 | 3

export type PointLogType = 1 | 2 | 3

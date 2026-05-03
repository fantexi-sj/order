export type OrderType = 'dine_in' | 'takeaway'

export type PaymentMethod = 'wechat' | 'alipay' | 'member'

export type OrderStatus = 0 | 1 | 2 | 3

export interface TimeSlot {
  label: string
  value: string
}

export interface DateOption {
  label: string
  date: string
  slots: TimeSlot[]
}

export interface OrderItemSpec {
  spec_id: number
  spec_name: string
  option_id: number
  option: {
    id: number
    name: string
    price: number
  }
}

export interface OrderItem {
  id?: number
  dish_id: number
  dish_name: string
  dish_image: string
  unit: string
  price: number
  quantity: number
  total_price: number
  specs: OrderItemSpec[]
}

export interface Order {
  id: number
  order_no: string
  merchant_id: number
  total_amount: number
  pay_amount: number
  discount_amount: number
  status: OrderStatus
  status_text: string
  remark: string
  pay_time: string | null
  cancel_time: string | null
  created_at: string
  updated_at?: string
  items: OrderItem[]
  order_type?: OrderType
  table_number?: string
  pickup_time?: string
  phone?: string
}

export interface OrderCreateParams {
  merchant_id: number
  cart_ids: string
  remark?: string
  order_type?: OrderType
  table_number?: string
  pickup_time?: string
  phone?: string
}

export interface OrderCreateResponse {
  order_id: number
  order_no: string
  total_amount: number
  pay_amount: number
}

export interface OrderListParams {
  merchant_id: number
  status?: OrderStatus
  page?: number
  page_size?: number
}

export interface OrderPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface OrderListData {
  list: Order[]
  pagination: OrderPagination
}

export interface OrderDetailData extends Order {
  shop_name?: string
}

export interface OrderPayResponse {
  order_id: number
  order_no: string
  pay_amount: number
}

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已完成'
}

export const ORDER_STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  0: '#FF9500',
  1: '#34C759',
  2: '#8E8E93',
  3: '#007AFF'
}

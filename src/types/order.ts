export type OrderType = 'dine_in' | 'takeaway'

export type PaymentMethod = 'wechat' | 'alipay' | 'member'

export interface TimeSlot {
  label: string
  value: string
}

export interface DateOption {
  label: string
  date: string
  slots: TimeSlot[]
}

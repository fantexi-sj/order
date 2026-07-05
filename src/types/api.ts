export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface LoginRequest {
  code: string
  merchant_id: number
}

export interface UserData {
  id: number
  name: string
  gender: 'male' | 'female'
  avatar_url: string
  birthday: string
}

export interface LoginResponse {
  token: string
  user: UserData
}

export interface UpdateUserInfoRequest {
  name?: string
  avatar_url?: string
  gender?: 'male' | 'female'
  birthday?: string
}

export interface MemberData {
  points: number
  total_points: number
  balance: number
  gift_balance: number
  total_recharge: number
  total_gift: number
  total_orders: number
  total_spent: number
  status: number
}

export interface UserInfoResponse {
  id: number
  name: string
  gender: 'male' | 'female'
  avatar_url: string
  birthday: string
  created_at?: string
  member?: MemberData | null
}

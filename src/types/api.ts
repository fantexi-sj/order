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

export interface UserInfoResponse {
  id: number
  name: string
  gender: 'male' | 'female'
  avatar_url: string
  birthday: string
}

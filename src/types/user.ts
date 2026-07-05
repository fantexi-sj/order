export interface MemberInfo {
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

export interface UserInfo {
  id: number
  openid?: string
  name: string
  gender: 'male' | 'female'
  avatarUrl: string
  birthday: string
  member?: MemberInfo | null
}

export interface UserStoreState {
  userInfo: UserInfo
  isLoggedIn: boolean
  setUserInfo: (userInfo: UserInfo) => void
  initUserInfo: (userInfo: UserInfo) => void
  setIsLoggedIn: (isLoggedIn: boolean) => void
  setMemberInfo: (member: MemberInfo | null) => void
  setUserPoints: (points: number) => void
  fetchUserInfoWithMember: () => Promise<void>
  getUserName: () => string
  getUserAvatar: () => string
  getUserPoints: () => number
  logout: () => void
}

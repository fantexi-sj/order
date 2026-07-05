import { create } from 'zustand'
import type { UserStoreState, UserInfo, MemberInfo } from '../types/user'
import { storage } from '../utils/storage'
import { userApi } from '../api/user'

const defaultUserInfo: UserInfo = {
  id: 0,
  name: '游客',
  gender: 'male',
  avatarUrl: '/assets/tabbar/user.png',
  birthday: '2000-01-01',
  member: null
}

const useUserStore = create<UserStoreState>((set, get) => ({
  userInfo: defaultUserInfo,
  isLoggedIn: false,

  setUserInfo: (userInfo: UserInfo) => {
    set({ userInfo, isLoggedIn: true })
    storage.setUserInfo(userInfo)
  },

  initUserInfo: (userInfo: UserInfo) => {
    set({ userInfo, isLoggedIn: true })
  },

  setIsLoggedIn: (isLoggedIn: boolean) => {
    set({ isLoggedIn })
  },

  setMemberInfo: (member: MemberInfo | null) => {
    set((state) => ({
      userInfo: {
        ...state.userInfo,
        member
      }
    }))
  },

  setUserPoints: (points: number) => {
    set((state) => ({
      userInfo: {
        ...state.userInfo,
        member: state.userInfo.member
          ? { ...state.userInfo.member, points }
          : { 
              points,
              total_points: 0,
              balance: 0,
              gift_balance: 0,
              total_recharge: 0,
              total_gift: 0,
              total_orders: 0,
              total_spent: 0,
              status: 1
            }
      }
    }))
  },

  fetchUserInfoWithMember: async () => {
    try {
      const response = await userApi.getUserInfo(true)
      if (response.code === 200 && response.data) {
        const { name, avatar_url, member } = response.data
        set((state) => ({
          userInfo: {
            ...state.userInfo,
            name: name || state.userInfo.name,
            avatarUrl: avatar_url || state.userInfo.avatarUrl,
            member: member || null
          }
        }))
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  getUserName: () => {
    return get().userInfo.name || '游客'
  },

  getUserAvatar: () => {
    return get().userInfo.avatarUrl || '/assets/tabbar/user.png'
  },

  getUserPoints: () => {
    return get().userInfo.member?.points || 0
  },

  logout: () => {
    set({ userInfo: defaultUserInfo, isLoggedIn: false })
    storage.clearAll()
  }
}))

export default useUserStore

import { create } from 'zustand';
import type { UserStoreState, UserInfo } from '../types/user';
import { storage } from '../utils/storage';

const defaultUserInfo: UserInfo = {
  id: 0,
  name: '游客',
  gender: 'male',
  avatarUrl: '/assets/tabbar/user.png',
  birthday: '',
};

const useUserStore = create<UserStoreState>((set, get) => ({
  userInfo: defaultUserInfo,
  isLoggedIn: false,

  setUserInfo: (userInfo: UserInfo) => {
    set({ userInfo, isLoggedIn: true });
    storage.setUserInfo(userInfo);
  },

  initUserInfo: (userInfo: UserInfo) => {
    set({ userInfo, isLoggedIn: true });
  },

  setIsLoggedIn: (isLoggedIn: boolean) => {
    set({ isLoggedIn });
  },

  getUserName: () => {
    return get().userInfo.name || '游客';
  },

  getUserAvatar: () => {
    return get().userInfo.avatarUrl || '/assets/tabbar/user.png';
  },

  logout: () => {
    set({ userInfo: defaultUserInfo, isLoggedIn: false });
    storage.clearAll();
  },
}));

export default useUserStore;

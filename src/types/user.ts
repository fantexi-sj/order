export interface UserInfo {
  id: number;
  openid?: string;
  name: string;
  gender: 'male' | 'female';
  avatarUrl: string;
  birthday: string;
}

export interface UserStoreState {
  userInfo: UserInfo;
  isLoggedIn: boolean;
  setUserInfo: (userInfo: UserInfo) => void;
  initUserInfo: (userInfo: UserInfo) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  getUserName: () => string;
  getUserAvatar: () => string;
  logout: () => void;
}

import { create } from 'zustand';
import type { ShopStoreState, ShopInfo } from '../types/shop';

const useShopStore = create<ShopStoreState>((set, get) => ({
  shopInfo: null,

  setShopInfo: (shopInfo: ShopInfo) => {
    set({ shopInfo });
  },

  getShopName: () => {
    return get().shopInfo?.shopname || '店铺商家';
  },

  getBusinessHours: () => {
    return get().shopInfo?.business_hours || '暂未营业';
  },

  getShopAddress: () => {
    return get().shopInfo?.address || '暂无地址';
  },

  getNotice: () => {
    return get().shopInfo?.notice || '暂无公告';
  },

  getBusinessDays: () => {
    return get().shopInfo?.business_days || '每日';
  },

  getFullBusinessTime: () => {
    const shopInfo = get().shopInfo;
    return `${shopInfo?.business_days || '每日'} ${shopInfo?.business_hours || '暂未营业'}`;
  },
}));

export default useShopStore;

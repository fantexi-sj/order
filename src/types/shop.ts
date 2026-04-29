export interface ShopInfo {
  id: number;
  merchant_no: string;
  shopname: string;
  business_hours: string;
  address: string;
  notice: string;
  business_days: string;
  created_at: string;
}

export interface ShopStoreState {
  shopInfo: ShopInfo | null;
  setShopInfo: (shopInfo: ShopInfo) => void;
  getShopName: () => string;
  getBusinessHours: () => string;
  getShopAddress: () => string;
  getNotice: () => string;
  getBusinessDays: () => string;
  getFullBusinessTime: () => string;
}

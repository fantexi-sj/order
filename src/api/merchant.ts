import request from '../utils/request'
import type { ShopInfo } from '../types/shop'
import type { CategoryItem, DishItem, DishSpecsData } from '../types/menu'

const MERCHANT_ID = 1

export const merchantApi = {
  getMerchantInfo: () => {
    return request.get<ShopInfo>('/merchant/info', { merchant_id: MERCHANT_ID }, false)
  },

  getDishList: () => {
    return request.get<CategoryItem[]>('/dish/list', { merchant_id: MERCHANT_ID }, false)
  },

  getDishByCategory: (categoryId: number) => {
    return request.get<DishItem[]>('/dish/by-category', { 
      merchant_id: MERCHANT_ID, 
      category_id: categoryId 
    }, false)
  },

  getDishSpecs: (dishId: number) => {
    return request.get<DishSpecsData>('/spec/dish-specs', {
      dish_id: dishId,
      merchant_id: MERCHANT_ID
    }, false)
  }
}

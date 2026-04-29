import request from '../utils/request'
import type { CartListData, CartAddParams, CartAddResponse, CartUpdateResponse } from '../types/cart'

const MERCHANT_ID = 1

export const cartApi = {
  getCartList: () => {
    return request.get<CartListData>('/cart/list', { merchant_id: MERCHANT_ID })
  },

  addToCart: (data: CartAddParams) => {
    return request.post<CartAddResponse>('/cart/add', {
      merchant_id: MERCHANT_ID,
      ...data
    })
  },

  updateQuantity: (id: number, quantity: number) => {
    return request.put<CartUpdateResponse>(`/cart/quantity/${id}`, { quantity })
  },

  removeCartItem: (id: number) => {
    return request.delete<null>(`/cart/remove/${id}`)
  },

  getCheckout: (cartIds?: number[]) => {
    const params: Record<string, any> = { merchant_id: MERCHANT_ID }
    if (cartIds && cartIds.length > 0) {
      params.cart_ids = cartIds.join(',')
    }
    return request.get<CartListData>('/cart/checkout', params)
  }
}

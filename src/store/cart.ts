import { create } from 'zustand';
import type { CartStoreState, CartItem, CartSummary } from '../types/cart';

const defaultSummary: CartSummary = {
  total_quantity: 0,
  total_amount: 0
};

const useCartStore = create<CartStoreState>((set, get) => ({
  items: [],
  summary: defaultSummary,

  setItems: (items: CartItem[]) => {
    set({ items });
  },

  setSummary: (summary: CartSummary) => {
    set({ summary });
  },

  toggleSelectItem: (itemId: number) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    }));
  },

  selectAll: () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, selected: true }))
    }));
  },

  unselectAll: () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, selected: false }))
    }));
  },

  clearCart: () => {
    set({ items: [], summary: defaultSummary });
  },

  getDishQuantity: (dishId: number) => {
    return get().items
      .filter((item) => item.dish_id === dishId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  getCategoryQuantity: (categoryId: number) => {
    return get().items
      .filter((item) => item.category_id === categoryId)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalQuantity: () => {
    return get().items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.total_price, 0);
  },

  getSelectedItems: () => {
    return get().items.filter((item) => item.selected);
  }
}));

export default useCartStore;

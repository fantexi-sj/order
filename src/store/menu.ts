import { create } from 'zustand';
import type { MenuStoreState, CategoryItem } from '../types/menu';

const useMenuStore = create<MenuStoreState>((set, get) => ({
  categories: [],
  currentCategoryId: 1,

  setCategories: (categories: CategoryItem[]) => {
    set({ categories, currentCategoryId: categories[0]?.id || 1 });
  },

  setCurrentCategory: (categoryId: number) => {
    set({ currentCategoryId: categoryId });
  },

  getCategoryById: (categoryId: number) => {
    return get().categories.find(cat => cat.id === categoryId);
  }
}));

export default useMenuStore;

export interface SpecOption {
  id: number;
  name: string;
  price: number;
  sort_order: number;
}

export interface SpecGroup {
  id: number;
  name: string;
  is_required: boolean;
  sort_order: number;
  options: SpecOption[];
}

export interface DishSpecsData {
  has_spec: boolean;
  specs: SpecGroup[];
}

export interface DishItem {
  id: number;
  category_id: number;
  name: string;
  image: string;
  price: string;
  unit: string;
  sales_count: number;
  status: number;
  sort_order: number;
  has_spec: number;
}

export interface CategoryItem {
  id: number;
  name: string;
  dishes: DishItem[];
}

export interface MenuStoreState {
  categories: CategoryItem[];
  currentCategoryId: number;
  setCategories: (categories: CategoryItem[]) => void;
  setCurrentCategory: (categoryId: number) => void;
  getCategoryById: (categoryId: number) => CategoryItem | undefined;
}

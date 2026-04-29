export interface CartItemSpecOption {
  id: number;
  name: string;
  price: number;
}

export interface CartItemSpec {
  spec_id: number;
  spec_name: string;
  option_id: number;
  option: CartItemSpecOption;
}

export interface CartItem {
  id: number;
  dish_id: number;
  dish_name: string;
  dish_image: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  specs: CartItemSpec[];
  category_id?: number;
  selected: boolean;
}

export interface CartSummary {
  total_quantity: number;
  total_amount: number;
}

export interface CartListData {
  items: CartItem[];
  summary: CartSummary;
}

export interface CartAddSpecItem {
  spec_id: number;
  spec_name: string;
  option_id: number;
  option: {
    id: number;
    name: string;
    price: number;
  };
}

export interface CartAddParams {
  merchant_id?: number;
  dish_id: number;
  quantity?: number;
  specs?: CartAddSpecItem[];
}

export interface CartAddResponse {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CartUpdateResponse {
  id: number;
  quantity: number;
  total_price: number;
}

export interface CartStoreState {
  items: CartItem[];
  summary: CartSummary;

  setItems: (items: CartItem[]) => void;
  setSummary: (summary: CartSummary) => void;
  toggleSelectItem: (itemId: number) => void;
  selectAll: () => void;
  unselectAll: () => void;
  clearCart: () => void;
  getDishQuantity: (dishId: number) => number;
  getCategoryQuantity: (categoryId: number) => number;
  getTotalQuantity: () => number;
  getTotalPrice: () => number;
  getSelectedItems: () => CartItem[];
}

import { createContext } from 'react';

export interface CartItem {
  productId: number;
  name: string;
  imgName: string;
  price: number;
  quantity: number;
}

export type CartProduct = Omit<CartItem, 'quantity'>;

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (product: CartProduct, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);

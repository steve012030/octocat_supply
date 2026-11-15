/* eslint-disable react-refresh/only-export-components */
import { useContext, useEffect, useState } from 'react';
import { CartContext, type CartContextValue, type CartItem, type CartProduct } from './cartContextUtils';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'octocat-supply-cart';

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === 'number' &&
    typeof item.name === 'string' &&
    typeof item.imgName === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function readSavedCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (!savedCart) {
      return [];
    }

    const parsed: unknown = JSON.parse(savedCart);
    if (!Array.isArray(parsed)) {
      throw new Error('Saved cart data must be an array.');
    }

    return parsed.filter(isCartItem);
  } catch (error) {
    console.error('Unable to read the saved shopping cart.', error);
    return [];
  }
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readSavedCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Unable to save the shopping cart.', error);
    }
  }, [items]);

  const addItem = (product: CartProduct, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.productId);
      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...currentItems, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isInteger(quantity)) {
      return;
    }
    if (quantity <= 0) {
      setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    );
  };

  const removeItem = (productId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const value: CartContextValue = {
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    addItem,
    updateQuantity,
    removeItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

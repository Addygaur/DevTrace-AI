/**
 * Cart service — mutable cart state for logged-in and guest users.
 * Downstream: checkout reads cart snapshots; promotions engine mutates line items.
 */

export interface CartItem {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
}

export function cartTotalCents(cart: Cart): number {
  return cart.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );
}

export function addItem(cart: Cart, item: CartItem): Cart {
  const existing = cart.items.find((i) => i.sku === item.sku);
  if (existing) {
    existing.quantity += item.quantity;
    return cart;
  }
  return { ...cart, items: [...cart.items, item] };
}

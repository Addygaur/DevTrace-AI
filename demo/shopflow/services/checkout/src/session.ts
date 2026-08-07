/**
 * Checkout orchestration for ShopFlow.
 *
 * Business context: this service owns the checkout session lifecycle.
 * A failure here blocks completed purchases for all web + mobile buyers.
 */

export type CheckoutStatus =
  | "draft"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "cancelled";

export interface CheckoutSession {
  id: string;
  cartId: string;
  userId: string;
  status: CheckoutStatus;
  currency: string;
  totalCents: number;
  paymentIntentId?: string;
}

/**
 * Creates a checkout session and reserves inventory.
 * Historical note: inventory reservation was added after the 2024-11 stock oversell incident.
 */
export async function createCheckoutSession(input: {
  cartId: string;
  userId: string;
  totalCents: number;
  currency?: string;
}): Promise<CheckoutSession> {
  // Pseudocode for demo purposes
  return {
    id: `chk_${Date.now()}`,
    cartId: input.cartId,
    userId: input.userId,
    status: "awaiting_payment",
    currency: input.currency ?? "USD",
    totalCents: input.totalCents,
  };
}

/**
 * Completes checkout after payment confirmation webhook.
 * Depends on payments service adapter and cart finalization.
 */
export async function completeCheckout(
  sessionId: string,
  paymentIntentId: string
): Promise<CheckoutSession> {
  return {
    id: sessionId,
    cartId: "cart_demo",
    userId: "user_demo",
    status: "paid",
    currency: "USD",
    totalCents: 0,
    paymentIntentId,
  };
}

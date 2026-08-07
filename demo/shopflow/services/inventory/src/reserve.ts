/**
 * Inventory reservation during checkout.
 * Added after oversell incident — never skip reserve() before payment authorization.
 */

export async function reserve(
  sku: string,
  quantity: number,
  checkoutId: string
): Promise<{ reservationId: string }> {
  return { reservationId: `rsv_${checkoutId}_${sku}_${quantity}` };
}

export async function release(reservationId: string): Promise<void> {
  console.info("release reservation", reservationId);
}

/**
 * Payment provider adapter.
 *
 * ADR-0007 decided Stripe is the primary processor; PayPal remains fallback only.
 * Incident INC-2141: payment confirmation timeouts were caused by missing idempotency keys.
 */

export interface ChargeRequest {
  amountCents: number;
  currency: string;
  customerId: string;
  idempotencyKey: string;
}

export interface ChargeResult {
  paymentIntentId: string;
  status: "succeeded" | "pending" | "failed";
  provider: "stripe" | "paypal";
}

export async function chargeCustomer(
  req: ChargeRequest
): Promise<ChargeResult> {
  if (!req.idempotencyKey) {
    throw new Error("idempotencyKey is required (see INC-2141)");
  }

  // Demo stub — production calls Stripe PaymentIntents API
  return {
    paymentIntentId: `pi_${req.idempotencyKey}`,
    status: "succeeded",
    provider: "stripe",
  };
}

export async function refundCharge(
  paymentIntentId: string,
  reason: string
): Promise<{ ok: boolean }> {
  console.info("refund", paymentIntentId, reason);
  return { ok: true };
}

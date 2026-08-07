# ShopFlow

Fictional e-commerce checkout platform used as the DevTrace AI demo repository.

## Services

- `services/checkout` — checkout orchestration and payment initiation
- `services/cart` — shopping cart state
- `services/payments` — payment provider adapters (Stripe-first)
- `services/inventory` — stock reservation during checkout
- `apps/web` — storefront

## Why this repo exists

ShopFlow is the production checkout path for Acme Retail. Latency and correctness here directly affect conversion and revenue.

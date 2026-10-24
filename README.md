<div align="center">

# `kkhay`

**Official Node.js & TypeScript SDK for K Khay — The Non-Custodial Crypto Payment Gateway**

[![npm version](https://img.shields.io/npm/v/kkhay.svg?style=flat-square&color=10b981)](https://www.npmjs.com/package/kkhay)
[![CI](https://github.com/boboaungdev/kkhay-node/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/boboaungdev/kkhay-node/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/kkhay.svg?style=flat-square)](https://www.npmjs.com/package/kkhay)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg?style=flat-square)](https://nodejs.org/)

Accept cryptocurrency payments across **190+ blockchain networks** and **500+ tokens** (EVM, Bitcoin, Solana, TON, Tron, and XRPL) with **zero custody** and automatic direct-to-wallet settlement.

[Gateway Dashboard](https://gateway.kkhay.com) • [API Keys](https://gateway.kkhay.com/dashboard/keys) • [Website](https://kkhay.com)

</div>

---

## ⚡ Key Highlights

- 🛡️ **100% Non-Custodial**: Payments settle directly to your destination blockchain address in seconds. K Khay never holds your private keys or customer funds.
- 🌐 **190+ Networks Supported**: 
  - **EVM Networks**: Ethereum, BNB Smart Chain, Polygon, Arbitrum, Base, Optimism, Avalanche, and 180+ more.
  - **UTXO Networks**: Bitcoin (`btc`), Dogecoin (`doge`), Litecoin (`ltc`), Bitcoin Cash (`bch`).
  - **High-Throughput Chains**: Solana (`sol`), TON (`ton`), Tron (`trx`), XRP Ledger (`xrp`).
- 🪙 **500+ Cryptocurrencies**: Native coins and tokens (USDT, USDC, BTC, ETH, SOL, TON, BNB, DOGE, XRP, TRX, LTC, and more).
- 🔗 **Branded Hosted Checkouts**: Automatic payment links with dynamic QR codes, live blockchain polling, and wallet deep linking.
- 🔔 **Cryptographic Webhooks**: HMAC-SHA256 signed Instant Payment Notifications (`x-kkhay-signature`).
- 📦 **Dual ESM & CommonJS**: Zero runtime dependencies, fully typed TypeScript definitions.

---

## 📦 Installation

```bash
# npm
npm install kkhay

# pnpm
pnpm add kkhay

# yarn
yarn add kkhay

# bun
bun add kkhay
```

---

## 🚀 Quickstart

### 1. Initialize the Client

Generate your API key in the [K Khay Gateway Dashboard](https://gateway.kkhay.com/dashboard/keys).

```typescript
// ES Modules & TypeScript
import { KkhayClient } from "kkhay"

// CommonJS
const { KkhayClient } = require("kkhay")

const kkhay = new KkhayClient({
  apiKey: process.env.KKHAY_API_KEY!, // starts with "kkhay_live_"
})
```

---

### 2. Create a Crypto Payment Invoice

Accept stablecoins, native coins, or let the customer choose their preferred token and chain:

```typescript
// Example A: USDT on BNB Smart Chain (BSC)
const { invoice } = await kkhay.createInvoice({
  amount: 49.99,
  currency: "USD",
  payNetwork: "bsc",       // "bsc" | "polygon" | "base" | "arbitrum" | "ethereum" | "solana" | "bitcoin" | "ton"
  payToken: "USDT",        // "USDT" | "USDC" | "BTC" | "ETH" | "SOL" | "TON"
  orderId: "ORDER-9842",   // Your internal order ID
  title: "Annual Pro Plan",
  customerName: "Alice Smith",
  customerEmail: "alice@example.com",
  redirectUrl: "https://myshop.com/orders/success",
  cancelUrl: "https://myshop.com/cart",
})

console.log("Invoice ID:", invoice.id)
console.log("Gateway ID:", invoice.gatewayId)
console.log("Deposit Address:", invoice.depositAddress)
console.log("Hosted Checkout URL:", invoice.hostedUrl)

// Redirect your customer to the hosted checkout:
// res.redirect(invoice.hostedUrl)
```

```typescript
// Example B: Native Bitcoin or Solana
const btcInvoice = await kkhay.createInvoice({
  amount: 120.00,
  currency: "USD",
  payNetwork: "bitcoin",
  payToken: "BTC",
  orderId: "ORDER-9843",
})

const solInvoice = await kkhay.createInvoice({
  amount: 25.00,
  currency: "USD",
  payNetwork: "solana",
  payToken: "SOL",
  orderId: "ORDER-9844",
})
```

---

### 3. Verify Incoming Webhooks (IPN)

When a customer pays and the blockchain confirms the transaction, K Khay sends a cryptographically signed `POST` webhook to your server.

#### In Next.js (App Router):

```typescript
// app/api/webhooks/kkhay/route.ts
import { NextRequest, NextResponse } from "next/server"
import { parseWebhookEvent } from "kkhay"

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-kkhay-signature")

  try {
    const event = parseWebhookEvent(
      rawBody,
      signature,
      process.env.KKHAY_WEBHOOK_SECRET!
    )

    if (event.event === "payment.finished" || event.event === "payment.paid") {
      console.log(`Payment confirmed for Order ${event.order_id}!`)
      console.log(`Tx Hash: ${event.tx_hash}`)
      console.log(`Received: ${event.pay_amount} ${event.pay_token} on ${event.pay_network}`)
      // Fulfill your customer's order in your database
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }
}
```

#### In Express.js:

```javascript
const express = require("express")
const { verifyWebhookSignature } = require("kkhay")

const app = express()

// Must capture raw body for HMAC signature verification
app.post(
  "/webhooks/kkhay",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-kkhay-signature"]
    const rawBody = req.body.toString("utf8")

    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      process.env.KKHAY_WEBHOOK_SECRET
    )

    if (!isValid) {
      return res.status(400).send("Invalid signature")
    }

    const event = JSON.parse(rawBody)
    if (event.event === "payment.finished" || event.event === "payment.paid") {
      console.log("Order paid successfully:", event.order_id)
    }

    res.status(200).json({ received: true })
  }
)
```

---

### 4. Fetch & List Invoices

```typescript
// Retrieve single invoice status
const { invoice, payments } = await kkhay.getInvoice("inv_0192a3b4c5d6...")
console.log("Status:", invoice.status) // "WAITING" | "PAID" | "EXPIRED" | "CANCELED"

// List invoices with pagination
const response = await kkhay.listInvoices({
  page: 1,
  limit: 20,
  status: "PAID",
})

console.log(`Found ${response.totalCount} paid invoices.`)
```

---

## 🌐 Supported Networks & Families

| Network Family | Popular Chains | Supported Tokens |
| :--- | :--- | :--- |
| **EVM (180+ Chains)** | Ethereum, BNB Smart Chain, Polygon, Arbitrum, Base, Optimism, Avalanche | USDT, USDC, ETH, BNB, POL, AVAX, DAI, and all ERC-20s |
| **UTXO** | Bitcoin, Dogecoin, Litecoin, Bitcoin Cash | BTC, DOGE, LTC, BCH |
| **Solana** | Solana Mainnet | SOL, USDT, USDC |
| **TON** | The Open Network | TON, USDT |
| **Tron (TVM)** | Tron Mainnet | TRX, USDT |
| **XRPL** | XRP Ledger | XRP |

---

## 🛡️ Error Handling

The SDK throws structured `KkhayApiError` instances containing HTTP status codes and API error messages:

```typescript
import { KkhayClient, KkhayApiError } from "kkhay"

const kkhay = new KkhayClient({ apiKey: "invalid_key" })

try {
  await kkhay.getInvoice("inv_nonexistent")
} catch (err) {
  if (err instanceof KkhayApiError) {
    console.error(`API Error ${err.status}: ${err.message}`)
    console.error(`Details:`, err.details)
  }
}
```

---

## 📄 License

MIT © [K Khay](https://kkhay.com)

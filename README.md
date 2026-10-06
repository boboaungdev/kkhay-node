<div align="center">

# `kkhay`

**Official Node.js & TypeScript SDK for the K Khay Non-Custodial Crypto Payment Gateway**

[![npm version](https://img.shields.io/npm/v/kkhay.svg?style=flat-square&color=10b981)](https://www.npmjs.com/package/kkhay)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg?style=flat-square)](https://nodejs.org/)

Accept cryptocurrency payments across BNB Smart Chain, Polygon, Base, Arbitrum, and Ethereum with **zero custody** and automatic on-chain settlement forwarding.

[Dashboard](https://kkhay.com/merchant) • [API Documentation](https://kkhay.com/merchant/api-keys) • [Website](https://kkhay.com)

</div>

---

## ⚡ Features

- 🛡️ **100% Non-Custodial**: Payments settle directly to your destination EVM wallet in seconds. K Khay never holds your crypto.
- 🌐 **Multi-Chain EVM**: Native coins (BNB, ETH, POL, AVAX) and ERC-20 tokens (USDT, USDC).
- 🔗 **Branded Hosted Checkouts**: Automatic payment links with QR codes and Web3 Connect (MetaMask, Coinbase Wallet, Trust Wallet).
- 🔔 **Cryptographic Webhooks**: HMAC-SHA256 signed Instant Payment Notifications (IPN).
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
```

---

## 🚀 Quickstart

### 1. Initialize the Client

Generate your API key in the [K Khay Merchant Dashboard](https://kkhay.com/merchant/api-keys).

```typescript
import { KkhayClient } from "kkhay"

const kkhay = new KkhayClient({
  apiKey: process.env.KKHAY_API_KEY!, // starts with "kkhay_live_"
})
```

---

### 2. Create a Crypto Payment Invoice

```typescript
const { invoice } = await kkhay.createInvoice({
  priceAmount: 49.99,
  priceCurrency: "USD",
  payNetwork: "bsc",       // "bsc" | "polygon" | "base" | "arbitrum" | "ethereum"
  payToken: "USDT",        // "USDT" | "USDC" | "BNB" | "ETH"
  orderId: "ORDER-9842",   // Your internal order ID
  title: "Annual Pro Plan",
  customerName: "Alice Smith",
  customerEmail: "alice@example.com",
  redirectUrl: "https://myshop.com/orders/success",
  cancelUrl: "https://myshop.com/cart",
})

console.log("Invoice ID:", invoice.id)
console.log("Deposit Address:", invoice.depositAddress)
console.log("Hosted Checkout URL:", invoice.hostedUrl)

// Redirect customer to K Khay's hosted checkout page:
res.redirect(invoice.hostedUrl)
```

---

### 3. Verify Incoming Webhooks (IPN)

When a customer pays and the blockchain confirms the transaction, K Khay sends a signed `POST` webhook to your server.

#### In Next.js (App Router):

```typescript
// app/api/webhooks/kkhay/route.ts
import { NextResponse } from "next/server"
import { verifyWebhookSignature, parseWebhookEvent } from "kkhay"

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-kkhay-signature")

  try {
    // Verifies HMAC-SHA256 signature and returns typed event
    const event = parseWebhookEvent(
      rawBody,
      signature,
      process.env.KKHAY_IPN_SECRET!
    )

    if (event.event === "payment.finished") {
      const { order_id, pay_amount, pay_token, tx_hash } = event
      console.log(`✅ Order ${order_id} paid ${pay_amount} ${pay_token} (Tx: ${tx_hash})`)
      
      // Fulfill customer order in your database
      await fulfillOrder(order_id)
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    return new NextResponse("Invalid signature", { status: 401 })
  }
}
```

#### In Express.js:

```javascript
import express from "express"
import { parseWebhookEvent } from "kkhay"

const app = express()

// Ensure raw body is preserved for HMAC verification
app.post("/webhooks/kkhay", express.text({ type: "*/*" }), (req, res) => {
  try {
    const event = parseWebhookEvent(
      req.body,
      req.headers["x-kkhay-signature"],
      process.env.KKHAY_IPN_SECRET
    )

    if (event.event === "payment.finished") {
      console.log("Order paid:", event.order_id)
    }

    res.status(200).send("OK")
  } catch (err) {
    res.status(401).send("Invalid signature")
  }
})
```

---

## 📚 API Reference

### `kkhay.createInvoice(params)`
Creates a new payment invoice.

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `priceAmount` | `number` | **Yes** | Amount to charge the customer (e.g. `50.00`). |
| `payNetwork` | `string` | **Yes** | Settlement network (`"bsc"`, `"polygon"`, `"base"`, `"arbitrum"`, `"ethereum"`). |
| `payToken` | `string` | **Yes** | Payment token (`"USDT"`, `"USDC"`, `"BNB"`, `"ETH"`). |
| `priceCurrency` | `string` | No | Pricing currency code (`"USD"`, `"EUR"`). Defaults to `"USD"`. |
| `orderId` | `string` | No | Your internal order reference identifier. |
| `title` | `string` | No | Description displayed on checkout. |
| `customerName` | `string` | No | Customer's name. |
| `customerEmail` | `string` | No | Customer's email for receipts. |
| `redirectUrl` | `string` | No | URL to redirect customer upon payment confirmation. |
| `cancelUrl` | `string` | No | URL to redirect customer if they cancel checkout. |
| `ipnCallbackUrl`| `string` | No | Custom webhook URL for this specific invoice. |
| `metadata` | `object` | No | Custom key-value dictionary returned in webhooks. |

---

### `kkhay.getInvoice(invoiceId)`
Fetches the current status, on-chain confirmations, and blockchain transaction hashes for an invoice.

```typescript
const { invoice, payments } = await kkhay.getInvoice("019483ab-...")

console.log("Status:", invoice.status) // "WAITING" | "DETECTING" | "CONFIRMING" | "FINISHED"
if (payments.length > 0) {
  console.log("Blockchain Tx:", payments[0].txHash)
  console.log("Confirmations:", payments[0].confirmations)
}
```

---

### `kkhay.listInvoices(query)`
Fetches paginated invoices created under your merchant profile.

```typescript
const { items, totalCount, totalPages } = await kkhay.listInvoices({
  page: 1,
  limit: 20,
  status: "FINISHED",
})
```

---

### `verifyWebhookSignature(payload, signature, secret)`
Cryptographically verifies an incoming webhook using HMAC-SHA256 with timing-safe comparison.

```typescript
import { verifyWebhookSignature } from "kkhay"

const isValid = verifyWebhookSignature(
  rawRequestBody,
  req.headers["x-kkhay-signature"],
  process.env.KKHAY_IPN_SECRET!
)
```

---

## 🛡️ Error Handling

The SDK throws `KkhayApiError` on HTTP failures:

```typescript
import { KkhayClient, KkhayApiError } from "kkhay"

try {
  await kkhay.createInvoice({ ... })
} catch (error) {
  if (error instanceof KkhayApiError) {
    console.error("HTTP Status:", error.status)   // 400, 401, 422, etc.
    console.error("Message:", error.message)
    console.error("Details:", error.details)
  }
}
```

---

## 🌐 Supported Networks & Tokens

| Network | Native Token | Stablecoins |
| :--- | :--- | :--- |
| **BNB Smart Chain (BSC)** | `BNB` | `USDT`, `USDC` |
| **Polygon** | `POL` | `USDT`, `USDC` |
| **Base** | `ETH` | `USDC` |
| **Arbitrum One** | `ETH` | `USDT`, `USDC` |
| **Ethereum** | `ETH` | `USDT`, `USDC` |

---

## 📄 License

[MIT](LICENSE) © [K Khay](https://kkhay.com)


/**
 * K Khay Node.js SDK Type Definitions
 * Exact 1:1 match with K Khay Gateway Schema & DTOs
 *
 * @license MIT
 */

// ==========================================
// GATEWAY ENUMS
// ==========================================

/**
 * Real-time invoice status in K Khay Gateway.
 * Matches pgEnum "GatewayInvoiceStatus" in PostgreSQL / Drizzle ORM.
 */
export type GatewayInvoiceStatus =
  | "WAITING"
  | "PAID"
  | "EXPIRED"
  | "CANCELED"

export type KkhayInvoiceStatus = GatewayInvoiceStatus

/**
 * Classification of invoice intent.
 * Matches pgEnum "GatewayInvoiceType" in PostgreSQL / Drizzle ORM.
 */
export type GatewayInvoiceType = "PAYMENT" | "DONATION" | "SUBSCRIPTION"
export type InvoiceType = GatewayInvoiceType

/**
 * Fund custody and settlement model.
 * Matches pgEnum "GatewaySettlementMode" in PostgreSQL / Drizzle ORM.
 */
export type GatewaySettlementMode = "NON_CUSTODIAL" | "CUSTODIAL"
export type SettlementMode = GatewaySettlementMode

/**
 * Method customer used to submit payment.
 * Matches pgEnum "GatewayPaymentMethod" in PostgreSQL / Drizzle ORM.
 */
export type GatewayPaymentMethod = "DEPOSIT" | "WALLET"
export type PaymentMethod = GatewayPaymentMethod

/**
 * On-chain payment settlement status.
 * Matches pgEnum "GatewayPaymentStatus" in PostgreSQL / Drizzle ORM.
 */
export type GatewayPaymentStatus = "SETTLING" | "SETTLED" | "FAILED"

// ==========================================
// BLOCKCHAIN NETWORKS & TOKENS (190+ Networks & 500+ Currencies)
// ==========================================

export type PopularNetwork =
  | "bsc"
  | "polygon"
  | "base"
  | "arbitrum"
  | "ethereum"
  | "solana"
  | "ton"
  | "tron"
  | "bitcoin"
  | "optimism"
  | "avalanche"
  | "dogecoin"
  | "litecoin"
  | "bitcoincash"
  | "ripple"

export type NetworkId = PopularNetwork | (string & {})
export type NetworkFamily = "evm" | "utxo" | "solana" | "tvm" | "xrpl" | "ton"

export type PopularToken =
  | "USDT"
  | "USDC"
  | "BTC"
  | "ETH"
  | "SOL"
  | "TON"
  | "BNB"
  | "DOGE"
  | "XRP"
  | "TRX"
  | "LTC"
  | "BCH"
  | "POL"
  | "AVAX"
  | "DAI"

export type TokenSymbol = PopularToken | (string & {})

// ==========================================
// CLIENT CONFIGURATION
// ==========================================

export interface KkhayClientConfig {
  /**
   * Secret gateway API key (starts with `kkhay_live_` or `kkhay_test_`).
   * Retrieve from: https://gateway.kkhay.com/dashboard/keys
   */
  apiKey: string

  /**
   * Optional custom API base URL.
   * Defaults to production: `https://api.kkhay.com`
   */
  baseUrl?: string

  /**
   * Request timeout in milliseconds.
   * Defaults to 30,000ms (30 seconds).
   */
  timeoutMs?: number
}

// ==========================================
// INVOICE SCHEMAS & DTOS
// ==========================================

/**
 * Payload parameters for creating an invoice (matches createInvoiceSchema).
 */
export interface CreateInvoiceRequest {
  /**
   * Price amount to charge the customer.
   * Either `amount` or `priceAmount` must be provided.
   */
  amount?: number

  /**
   * Convenience alias for `amount`.
   */
  priceAmount?: number

  /**
   * Price currency code (e.g. "USD", "EUR", "THB", "USDT"). Defaults to "USD".
   */
  currency?: string

  /**
   * Convenience alias for `currency`.
   */
  priceCurrency?: string

  /**
   * Classification of invoice intent (default: "PAYMENT").
   */
  type?: GatewayInvoiceType

  /**
   * Blockchain network for payment (e.g. "bsc", "solana", "bitcoin", "ton").
   */
  payNetwork?: NetworkId

  /**
   * Token symbol accepted (e.g. "USDT", "USDC", "BTC", "ETH", "SOL", "TON").
   */
  payToken?: TokenSymbol

  /**
   * Target settlement cryptocurrency to lock upon settlement.
   */
  settlementAsset?: string | null

  /**
   * Gateway order reference ID (e.g. "ORD-94821").
   */
  orderId?: string

  /**
   * Product or service title displayed on checkout (e.g. "Annual Subscription").
   */
  title?: string

  /**
   * Customer display name.
   */
  customerName?: string

  /**
   * Customer email for receipt delivery.
   */
  customerEmail?: string

  /**
   * Return URL on successful payment confirmation.
   */
  redirectUrl?: string

  /**
   * Cancel return URL if customer cancels checkout.
   */
  cancelUrl?: string

  /**
   * Custom IPN Webhook callback URL for this specific invoice.
   */
  ipnCallbackUrl?: string

  /**
   * Custom metadata dictionary returned in webhooks and API responses.
   */
  metadata?: Record<string, unknown>
}

/**
 * Full Invoice DTO returned from K Khay Gateway (matches GatewayInvoiceDto in kkhay).
 */
export interface GatewayInvoiceDto {
  /** Unique invoice UUIDv7 */
  id: string

  /** Gateway account identifier */
  gatewayId: string

  /** Invoice type classification */
  type: GatewayInvoiceType

  /** Gateway order reference ID */
  orderId: string | null

  /** Display title */
  title: string | null

  /** Charged amount */
  amount: number

  /** Charged currency */
  currency: string

  /** Alias for amount */
  priceAmount: number

  /** Alias for currency */
  priceCurrency: string

  /** Settlement asset */
  settlementAsset: string | null

  /** Expected crypto payment amount */
  payAmount: string | null

  /** Expected crypto token symbol */
  payToken: string | null

  /** Blockchain network ID */
  payNetwork: string | null

  /** Locked exchange rate */
  lockedRate: string | null

  /** Dedicated on-chain deposit address */
  depositAddress: string

  /** Derivation index for deposit address */
  derivationIndex?: number

  /** Real-time status */
  status: GatewayInvoiceStatus

  /** Processing fee */
  feeAmount: string

  /** Net settled amount */
  netAmount: string

  /** Customer name */
  customerName: string | null

  /** Customer email */
  customerEmail: string | null

  /** Success redirect URL */
  redirectUrl: string | null

  /** Cancel redirect URL */
  cancelUrl: string | null

  /** Webhook IPN URL */
  ipnCallbackUrl: string | null

  /** Payment method used */
  paymentMethod?: GatewayPaymentMethod | null

  /** Settlement mode (NON_CUSTODIAL) */
  settlementMode?: GatewaySettlementMode | null

  /** Destination payout wallet address */
  payoutAddress: string

  /** Custom metadata dictionary */
  metadata: Record<string, unknown> | null

  /** Branded checkout URL */
  hostedUrl: string

  /** Expiration timestamp in ISO 8601 */
  expiresAt: string

  /** Creation timestamp in ISO 8601 */
  createdAt: string

  /** Last update timestamp in ISO 8601 */
  updatedAt: string
}

export type KkhayInvoice = GatewayInvoiceDto

/**
 * On-chain payment transaction (matches GatewayPaymentDto in kkhay).
 */
export interface GatewayPaymentDto {
  id: string
  invoiceId: string
  txHash: string
  fromAddress?: string | null
  amountReceived: string
  confirmations: number
  forwardedTxHash?: string | null
  forwardedAt?: string | null
  status: GatewayPaymentStatus
  createdAt: string
}

export type KkhayPaymentRecord = GatewayPaymentDto

/**
 * Response for single invoice lookup.
 */
export interface GetInvoiceResponse {
  ok: boolean
  invoice: GatewayInvoiceDto
  payments: GatewayPaymentDto[]
}

/**
 * Query parameters for paginated invoice listing.
 */
export interface ListInvoicesQuery {
  page?: number
  limit?: number
  status?: GatewayInvoiceStatus
  type?: GatewayInvoiceType
  search?: string
}

/**
 * Paginated invoice listing response.
 */
export interface ListInvoicesResponse {
  ok: boolean
  items: GatewayInvoiceDto[]
  totalCount: number
  totalPages: number
  currentPage: number
  limit: number
}

// ==========================================
// WEBHOOK NOTIFICATIONS
// ==========================================

/**
 * Webhook notification event payload (matches WebhookPayload in kkhay).
 */
export interface KkhayWebhookEvent {
  event:
    | "payment.paid"
    | "payment.finished"
    | "payment.confirming"
    | "payment.failed"
    | "invoice.canceled"
    | string
  invoice_id: string
  invoice_type?: GatewayInvoiceType
  gateway_id: string
  order_id: string | null
  amount?: number
  currency?: string
  price_amount: number
  price_currency: string
  pay_amount: string | null
  pay_token: string | null
  pay_network: string | null
  deposit_address: string
  tx_hash?: string | null
  status: string
  timestamp: string
}

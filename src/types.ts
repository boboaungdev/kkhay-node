/**
 * Configuration options for initializing the KkhayClient.
 */
export interface KkhayClientConfig {
  /**
   * Your secret merchant API key (starts with `kkhay_live_`).
   * Generated in the K Khay Merchant Dashboard under "API Keys".
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

/**
 * Payload parameters for creating a new crypto payment invoice.
 */
export interface CreateInvoiceRequest {
  /**
   * Price amount to charge the customer (e.g. 50.00).
   */
  priceAmount: number

  /**
   * Currency denomination of the price (e.g. "USD", "USDT", "USDC").
   * Defaults to "USD" or the payToken.
   */
  priceCurrency?: string

  /**
   * Blockchain network for payment settlement.
   * Supported: "bsc", "polygon", "base", "arbitrum", "ethereum"
   */
  payNetwork: "bsc" | "polygon" | "base" | "arbitrum" | "ethereum" | string

  /**
   * Token symbol accepted for this invoice.
   * Supported: "USDT", "USDC", "BNB", "ETH", "POL", etc.
   */
  payToken: string

  /**
   * Your internal e-commerce or application order reference ID (e.g. "ORD-94821").
   */
  orderId?: string

  /**
   * Product or service title displayed to the customer on checkout (e.g. "Pro Annual Plan").
   */
  title?: string

  /**
   * Optional customer display name.
   */
  customerName?: string

  /**
   * Optional customer contact email address for receipts.
   */
  customerEmail?: string

  /**
   * URL where the customer is redirected after completing payment on-chain.
   */
  redirectUrl?: string

  /**
   * URL where the customer is redirected if they choose to cancel checkout.
   */
  cancelUrl?: string

  /**
   * Custom IPN Webhook callback URL for this specific invoice.
   * Overrides default merchant webhook endpoint.
   */
  ipnCallbackUrl?: string

  /**
   * Custom arbitrary metadata object returned back in webhooks and API lookups.
   */
  metadata?: Record<string, unknown>
}

/**
 * Invoice status lifecycle.
 */
export type KkhayInvoiceStatus =
  | "WAITING"
  | "DETECTING"
  | "CONFIRMING"
  | "SENDING"
  | "FINISHED"
  | "EXPIRED"
  | "CANCELED"
  | "FAILED"

/**
 * Full details of a generated K Khay invoice.
 */
export interface KkhayInvoice {
  id: string
  merchantId: string
  orderId: string | null
  title: string | null
  priceAmount: number
  priceCurrency: string
  payAmount: string
  payToken: string
  payNetwork: string
  depositAddress: string
  status: KkhayInvoiceStatus
  feeAmount: string
  netAmount: string
  settlementMode?: "NON_CUSTODIAL" | "CUSTODIAL" | null
  paymentMethod?: "MANUAL_QR" | "WEB3_WALLET" | null
  hostedUrl: string
  redirectUrl?: string | null
  cancelUrl?: string | null
  expiresAt: string
  createdAt: string
}

/**
 * On-chain payment record associated with an invoice.
 */
export interface KkhayPaymentRecord {
  id: string
  txHash: string
  amountReceived: string
  confirmations: number
  status: string
  forwardedTxHash: string | null
  createdAt: string
}

/**
 * Response returned when querying a single invoice by ID.
 */
export interface GetInvoiceResponse {
  ok: boolean
  invoice: KkhayInvoice
  payments: KkhayPaymentRecord[]
}

/**
 * Query parameters for filtering and paginating invoices.
 */
export interface ListInvoicesQuery {
  page?: number
  limit?: number
  status?: KkhayInvoiceStatus | string
  search?: string
}

/**
 * Paginated list response for invoices.
 */
export interface ListInvoicesResponse {
  ok: boolean
  items: KkhayInvoice[]
  totalCount: number
  totalPages: number
  currentPage: number
  limit: number
}

/**
 * Webhook notification payload sent via Instant Payment Notification (IPN).
 */
export interface KkhayWebhookEvent {
  event: "payment.finished" | "payment.confirming" | "payment.failed" | "invoice.canceled" | string
  invoice_id: string
  order_id: string | null
  price_amount: number
  price_currency: string
  pay_amount: string
  pay_token: string
  pay_network: string
  deposit_address: string
  tx_hash: string | null
  status: string
  timestamp: string
}


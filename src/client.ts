import type {
  KkhayClientConfig,
  CreateInvoiceRequest,
  KkhayInvoice,
  GetInvoiceResponse,
  ListInvoicesQuery,
  ListInvoicesResponse,
} from "./types"

/**
 * Standard API error returned when a K Khay endpoint fails.
 */
export class KkhayApiError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(`KkhayApiError [HTTP ${status}]: ${message}`)
    this.name = "KkhayApiError"
    this.status = status
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, KkhayApiError.prototype)
  }
}

/**
 * Official Node.js and TypeScript client for the K Khay Crypto Merchant Payment Gateway.
 *
 * @example
 * ```typescript
 * import { KkhayClient } from "kkhay"
 *
 * const kkhay = new KkhayClient({
 *   apiKey: process.env.KKHAY_API_KEY!,
 * })
 *
 * const { invoice } = await kkhay.createInvoice({
 *   priceAmount: 49.99,
 *   payNetwork: "bsc",
 *   payToken: "USDT",
 *   orderId: "ORDER-101",
 *   title: "Pro Subscription",
 *   redirectUrl: "https://myshop.com/success",
 * })
 *
 * console.log("Hosted Checkout URL:", invoice.hostedUrl)
 * ```
 */
export class KkhayClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(config: KkhayClientConfig) {
    if (!config || !config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("KkhayClient: A valid 'apiKey' string is required.")
    }
    this.apiKey = config.apiKey.trim()
    this.baseUrl = (config.baseUrl || "https://api.kkhay.com").replace(/\/$/, "")
    this.timeoutMs = config.timeoutMs || 30_000
  }

  /**
   * Resolves endpoint URLs across subdomains, main domains, and local dev proxies.
   */
  private getUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path : `/${path}`
    if (this.baseUrl.endsWith("/api") || this.baseUrl.includes("api.")) {
      return `${this.baseUrl}${cleanPath}`
    }
    return `${this.baseUrl}/api${cleanPath}`
  }

  /**
   * Internal HTTP request handler with timeout and structured error extraction.
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = this.getUrl(path)
    const headers: Record<string, string> = {
      Accept: "application/json",
      "x-api-key": this.apiKey,
      ...(options.headers as Record<string, string>),
    }

    if (options.body && typeof options.body === "string") {
      headers["Content-Type"] = "application/json"
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timer)

      const contentType = response.headers.get("content-type") || ""
      const isJson = contentType.includes("application/json")

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`
        let errorCode: string | undefined
        let errorDetails: unknown

        if (isJson) {
          const errorBody = await response.json().catch(() => null)
          if (errorBody) {
            errorMessage = errorBody.message || errorBody.error || errorMessage
            errorCode = errorBody.code
            errorDetails = errorBody.details
          }
        } else {
          const text = await response.text().catch(() => "")
          if (text) errorMessage = text
        }

        throw new KkhayApiError(response.status, errorMessage, errorCode, errorDetails)
      }

      if (!isJson) {
        return {} as T
      }

      return (await response.json()) as T
    } catch (err) {
      clearTimeout(timer)
      if (err instanceof KkhayApiError) {
        throw err
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new KkhayApiError(408, `Request timed out after ${this.timeoutMs}ms`)
      }
      throw new KkhayApiError(500, err instanceof Error ? err.message : "Network error")
    }
  }

  /**
   * Create a new non-custodial crypto payment invoice.
   *
   * @param params Invoice configuration parameters
   * @returns Object containing the created invoice and customer hostedUrl
   */
  async createInvoice(params: CreateInvoiceRequest): Promise<{ ok: boolean; invoice: KkhayInvoice }> {
    if (!params.priceAmount || params.priceAmount <= 0) {
      throw new Error("createInvoice: 'priceAmount' must be a positive number.")
    }
    if (!params.payNetwork) {
      throw new Error("createInvoice: 'payNetwork' is required (e.g. 'bsc', 'polygon', 'base').")
    }
    if (!params.payToken) {
      throw new Error("createInvoice: 'payToken' is required (e.g. 'USDT', 'USDC', 'BNB').")
    }

    return this.request<{ ok: boolean; invoice: KkhayInvoice }>("/v1/merchant/invoices", {
      method: "POST",
      body: JSON.stringify(params),
    })
  }

  /**
   * Retrieve the status, blockchain transactions, and details of a specific invoice by ID.
   *
   * @param invoiceId The unique invoice UUID
   */
  async getInvoice(invoiceId: string): Promise<GetInvoiceResponse> {
    if (!invoiceId || typeof invoiceId !== "string") {
      throw new Error("getInvoice: 'invoiceId' is required.")
    }
    return this.request<GetInvoiceResponse>(`/v1/merchant/invoices/${encodeURIComponent(invoiceId)}`, {
      method: "GET",
    })
  }

  /**
   * List and filter invoices generated by your merchant account.
   *
   * @param query Pagination, status, and search filters
   */
  async listInvoices(query: ListInvoicesQuery = {}): Promise<ListInvoicesResponse> {
    const params = new URLSearchParams()
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    if (query.status) params.set("status", query.status)
    if (query.search) params.set("search", query.search)

    const queryStr = params.toString() ? `?${params.toString()}` : ""
    return this.request<ListInvoicesResponse>(`/v1/merchant/invoices${queryStr}`, {
      method: "GET",
    })
  }
}


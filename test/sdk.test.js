import test from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { KkhayClient, verifyWebhookSignature, parseWebhookEvent, KkhayApiError } from "../dist/index.js"

test("KkhayClient initialization", () => {
  const client = new KkhayClient({
    apiKey: "kkhay_live_test_12345",
  })

  assert.equal(client.baseUrl, "https://api.kkhay.com")

  const customClient = new KkhayClient({
    apiKey: "kkhay_test_key",
    baseUrl: "http://localhost:3000",
    timeoutMs: 5000,
  })

  assert.equal(customClient.baseUrl, "http://localhost:3000")
})

test("KkhayClient throws on missing API key", () => {
  assert.throws(() => {
    // @ts-expect-error test invalid param
    new KkhayClient({})
  }, /apiKey.*required/i)
})

test("KkhayClient validates createInvoice inputs", async () => {
  const client = new KkhayClient({
    apiKey: "kkhay_test_key",
  })

  await assert.rejects(async () => {
    // @ts-expect-error test invalid amount
    await client.createInvoice({ amount: 0 })
  }, /amount.*positive/i)
})

test("KkhayClient validates getInvoice inputs", async () => {
  const client = new KkhayClient({
    apiKey: "kkhay_test_key",
  })

  await assert.rejects(async () => {
    // @ts-expect-error test invalid id
    await client.getInvoice("")
  }, /invoiceId.*required/i)
})

test("KkhayClient creates invoice via /v1/gateway/invoices", async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ""
  let interceptedMethod = ""
  let interceptedHeaders = {}
  let interceptedBody = ""

  globalThis.fetch = async (url, options) => {
    interceptedUrl = String(url)
    interceptedMethod = options.method
    interceptedHeaders = options.headers
    interceptedBody = options.body
    return new Response(
      JSON.stringify({
        ok: true,
        invoice: {
          id: "01940000-0000-7000-8000-000000000001",
          gatewayId: "gw_123",
          amount: 50,
          currency: "USD",
          status: "WAITING",
          hostedUrl: "https://kkhay.com/invoice/01940000-0000-7000-8000-000000000001",
        },
      }),
      { status: 201, headers: { "content-type": "application/json" } }
    )
  }

  try {
    const client = new KkhayClient({ apiKey: "kkhay_live_secret123" })
    const res = await client.createInvoice({
      amount: 50,
      currency: "USD",
      payNetwork: "bsc",
      payToken: "USDT",
    })

    assert.equal(res.ok, true)
    assert.equal(res.invoice.gatewayId, "gw_123")
    assert.equal(interceptedUrl, "https://api.kkhay.com/v1/gateway/invoices")
    assert.equal(interceptedMethod, "POST")
    assert.equal(interceptedHeaders["x-api-key"], "kkhay_live_secret123")
    assert.match(interceptedBody, /"amount":50/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("KkhayClient retrieves invoice via /v1/gateway/invoices/:id", async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ""

  globalThis.fetch = async (url) => {
    interceptedUrl = String(url)
    return new Response(
      JSON.stringify({
        ok: true,
        invoice: {
          id: "01940000-0000-7000-8000-000000000002",
          gatewayId: "gw_456",
          status: "PAID",
        },
        payments: [],
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  try {
    const client = new KkhayClient({ apiKey: "kkhay_live_secret123" })
    const res = await client.getInvoice("01940000-0000-7000-8000-000000000002")

    assert.equal(res.ok, true)
    assert.equal(res.invoice.status, "PAID")
    assert.equal(interceptedUrl, "https://api.kkhay.com/v1/gateway/invoices/01940000-0000-7000-8000-000000000002")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("KkhayClient lists invoices with query filters", async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ""

  globalThis.fetch = async (url) => {
    interceptedUrl = String(url)
    return new Response(
      JSON.stringify({
        ok: true,
        items: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }

  try {
    const client = new KkhayClient({ apiKey: "kkhay_live_secret123" })
    const res = await client.listInvoices({ page: 1, limit: 10, status: "PAID" })

    assert.equal(res.ok, true)
    assert.equal(interceptedUrl, "https://api.kkhay.com/v1/gateway/invoices?page=1&limit=10&status=PAID")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("Webhook HMAC-SHA256 signature verification", () => {
  const secret = "whsec_supersecret_test_key_123"
  const payload = JSON.stringify({
    event: "payment.paid",
    invoice_id: "inv_12345",
    gateway_id: "gw_98765",
    order_id: "ORD-999",
    amount: 50.0,
    price_amount: 50.0,
    price_currency: "USD",
    pay_amount: "50.00",
    pay_token: "USDT",
    pay_network: "bsc",
    status: "PAID",
  })

  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex")

  // Valid signature
  assert.equal(verifyWebhookSignature(payload, signature, secret), true)

  // Tampered payload
  assert.equal(verifyWebhookSignature(payload + "tampered", signature, secret), false)

  // Invalid secret
  assert.equal(verifyWebhookSignature(payload, signature, "wrong_secret"), false)

  // Missing or null signature
  assert.equal(verifyWebhookSignature(payload, null, secret), false)
})

test("parseWebhookEvent validation", () => {
  const secret = "whsec_test_secret"
  const rawBody = JSON.stringify({
    event: "payment.paid",
    invoice_id: "inv_abc123",
    gateway_id: "gw_xyz789",
    status: "PAID",
  })
  const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

  const event = parseWebhookEvent(rawBody, signature, secret)
  assert.equal(event.event, "payment.paid")
  assert.equal(event.invoice_id, "inv_abc123")
  assert.equal(event.gateway_id, "gw_xyz789")

  // Throws on signature mismatch
  assert.throws(() => {
    parseWebhookEvent(rawBody, "invalid_signature", secret)
  }, /Invalid.*webhook signature/i)
})

test("KkhayApiError formats correctly", () => {
  const err = new KkhayApiError(400, "Invoice expired", "INVOICE_EXPIRED")
  assert.equal(err.name, "KkhayApiError")
  assert.equal(err.status, 400)
  assert.equal(err.code, "INVOICE_EXPIRED")
  assert.match(err.message, /Invoice expired/)
})

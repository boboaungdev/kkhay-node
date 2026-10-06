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

test("Webhook HMAC-SHA256 signature verification", () => {
  const secret = "whsec_supersecret_test_key_123"
  const payload = JSON.stringify({
    event: "payment.finished",
    invoice_id: "inv_12345",
    order_id: "ORD-999",
    pay_amount: "50.00",
    pay_token: "USDT",
    pay_network: "bsc",
    status: "paid",
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
    event: "payment.finished",
    invoice_id: "inv_abc123",
    status: "paid",
  })
  const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

  const event = parseWebhookEvent(rawBody, signature, secret)
  assert.equal(event.event, "payment.finished")
  assert.equal(event.invoice_id, "inv_abc123")

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


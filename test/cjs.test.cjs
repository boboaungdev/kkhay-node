const test = require("node:test")
const assert = require("node:assert/strict")
const { KkhayClient, verifyWebhookSignature, parseWebhookEvent, KkhayApiError } = require("../dist/index.cjs")

test("CommonJS: KkhayClient initialization", () => {
  const client = new KkhayClient({
    apiKey: "kkhay_live_test_12345",
  })
  assert.equal(client.baseUrl, "https://api.kkhay.com")
})

test("CommonJS: Exports verification", () => {
  assert.equal(typeof KkhayClient, "function")
  assert.equal(typeof verifyWebhookSignature, "function")
  assert.equal(typeof parseWebhookEvent, "function")
  assert.equal(typeof KkhayApiError, "function")
})


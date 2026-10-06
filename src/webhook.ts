import crypto from "node:crypto"
import type { KkhayWebhookEvent } from "./types"

/**
 * Verifies the cryptographic HMAC-SHA256 signature sent with incoming K Khay IPN webhooks.
 *
 * @param payload The raw string body or JSON object received in the webhook request
 * @param signature The signature from the `x-kkhay-signature` HTTP header
 * @param ipnSecret Your merchant IPN Secret Key (from K Khay Dashboard -> Webhooks)
 * @returns boolean `true` if the signature is authentic and untampered
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from "kkhay"
 *
 * const isValid = verifyWebhookSignature(
 *   rawBody,
 *   req.headers["x-kkhay-signature"],
 *   process.env.KKHAY_IPN_SECRET!
 * )
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Record<string, unknown>,
  signature: string | null | undefined,
  ipnSecret: string
): boolean {
  if (!signature || !ipnSecret) return false

  const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload)

  try {
    const computed = crypto.createHmac("sha256", ipnSecret).update(rawBody).digest("hex")
    const computedBuffer = Buffer.from(computed, "utf8")
    const signatureBuffer = Buffer.from(signature.trim(), "utf8")

    if (computedBuffer.length !== signatureBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(computedBuffer, signatureBuffer)
  } catch {
    return false
  }
}

/**
 * Validates and safely parses an incoming K Khay webhook event.
 * Throws an Error if the signature is invalid or payload is malformed.
 *
 * @param rawBody The raw request body string
 * @param signature The `x-kkhay-signature` header value
 * @param ipnSecret Your merchant IPN Secret Key
 * @returns KkhayWebhookEvent Typed parsed webhook event
 */
export function parseWebhookEvent(
  rawBody: string,
  signature: string | null | undefined,
  ipnSecret: string
): KkhayWebhookEvent {
  const isValid = verifyWebhookSignature(rawBody, signature, ipnSecret)
  if (!isValid) {
    throw new Error("Invalid K Khay webhook signature: Request rejected.")
  }

  try {
    return JSON.parse(rawBody) as KkhayWebhookEvent
  } catch (err) {
    throw new Error(`Failed to parse webhook JSON payload: ${err instanceof Error ? err.message : String(err)}`)
  }
}


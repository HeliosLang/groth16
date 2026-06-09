import { strictEqual } from "node:assert"
import { test } from "node:test"

import { base64ToBytes, bytesToBase64 } from "../dist/base64.js"

test("base64 round trip", () => {
  const bytes = new Uint8Array([0, 1, 2, 3, 253, 254, 255])

  strictEqual(bytesToBase64(bytes), "AAECA/3+/w==")
  strictEqual(
    Array.from(base64ToBytes(bytesToBase64(bytes))).join(","),
    Array.from(bytes).join(",")
  )
})

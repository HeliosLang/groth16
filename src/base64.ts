const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

export function bytesToBase64(bytes: Uint8Array): string {
  let output = ""
  let i = 0

  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    output += alphabet[(n >> 18) & 63]
    output += alphabet[(n >> 12) & 63]
    output += alphabet[(n >> 6) & 63]
    output += alphabet[n & 63]
  }

  if (i < bytes.length) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0
    const n = (a << 16) | (b << 8)
    output += alphabet[(n >> 18) & 63]
    output += alphabet[(n >> 12) & 63]
    output += i + 1 < bytes.length ? alphabet[(n >> 6) & 63] : "="
    output += "="
  }

  return output
}

export function base64ToBytes(input: string): Uint8Array {
  const clean = input.trim()

  if (clean.length % 4 != 0) {
    throw new Error("invalid base64 length")
  }

  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0
  const bytes = new Uint8Array((clean.length / 4) * 3 - padding)
  let offset = 0

  for (let i = 0; i < clean.length; i += 4) {
    const a = decode(clean[i])
    const b = decode(clean[i + 1])
    const c = clean[i + 2] == "=" ? 0 : decode(clean[i + 2])
    const d = clean[i + 3] == "=" ? 0 : decode(clean[i + 3])
    const n = (a << 18) | (b << 12) | (c << 6) | d

    if (offset < bytes.length) bytes[offset++] = (n >> 16) & 255
    if (offset < bytes.length) bytes[offset++] = (n >> 8) & 255
    if (offset < bytes.length) bytes[offset++] = n & 255
  }

  return bytes
}

function decode(char: string | undefined): number {
  if (char === undefined) {
    throw new Error("invalid base64")
  }

  const index = alphabet.indexOf(char)

  if (index == -1) {
    throw new Error("invalid base64 character")
  }

  return index
}

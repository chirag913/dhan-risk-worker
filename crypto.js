import crypto from "crypto"

const ALGO = "aes-256-gcm"

async function decrypt(enc) {
  if (!process.env.TOKEN_ENC_KEY) {
    throw new Error("TOKEN_ENC_KEY env variable is missing")
  }

  const KEY = Buffer.from(process.env.TOKEN_ENC_KEY, "hex")

  const decipher = crypto.createDecipheriv(
    ALGO,
    KEY,
    Buffer.from(enc.iv, "hex")
  )

  decipher.setAuthTag(Buffer.from(enc.tag, "hex"))

  return (
    decipher.update(Buffer.from(enc.content, "hex")) +
    decipher.final("utf8")
  )
}

// ✅ EXPORT BOTH (like dhan.js)
export { decrypt }
export default decrypt

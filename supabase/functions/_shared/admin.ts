// Tiny HMAC-signed admin token (no JWT lib needed).
// Token format: base64url(payload).base64url(hmacSHA256(payload, secret))
// payload = JSON { exp: number }
const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

export async function createAdminToken(ttlSeconds = 60 * 60 * 8): Promise<string> {
  const secret = Deno.env.get("ADMIN_PASSWORD") ?? "";
  const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const payloadB64 = b64url(enc.encode(payload));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${b64url(sig)}`;
}

export async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;
  const secret = Deno.env.get("ADMIN_PASSWORD") ?? "";
  try {
    const expected = await hmac(secret, payloadB64);
    const got = b64urlDecode(sigB64);
    if (expected.length !== got.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ got[i];
    if (diff !== 0) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function getAdminToken(req: Request): string | null {
  const h = req.headers.get("x-admin-token");
  if (h) return h;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer admin:")) return auth.slice("Bearer admin:".length);
  return null;
}

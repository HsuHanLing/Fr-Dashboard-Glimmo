import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "dashboard_auth";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.DASHBOARD_PASSWORD;
  if (!secret) return new Uint8Array(0);
  return new TextEncoder().encode(secret);
}

export function isAuthEnabled(): boolean {
  return !!process.env.DASHBOARD_PASSWORD && process.env.DASHBOARD_PASSWORD.length > 0;
}

export async function createToken(): Promise<string> {
  const secret = getSecret();
  if (secret.length === 0) throw new Error("DASHBOARD_PASSWORD not set");
  return new SignJWT({ auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = getSecret();
  if (secret.length === 0) return true; // auth disabled
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };

// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is missing");
  }
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: { email: string; otp?: string }, expiresIn: string) {
  const secret = getSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  const secret = getSecretKey();
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { email: string; exp: number; otp?: string };
  } catch (error) {
    return null;
  }
}

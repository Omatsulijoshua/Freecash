import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getSecretKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'freecash_super_secret_development_key_change_in_production';
  return new TextEncoder().encode(secret);
};

export const AUTH_COOKIE_NAME = 'freecash_session';

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: 'EARNER' | 'ADVERTISER' | 'ADMIN' | 'SUPPORT';
  status: string;
  referralCode: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(payload: UserSessionPayload, expiresIn = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as UserSessionPayload;
  } catch (err: any) {
    return null;
  }
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FC';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

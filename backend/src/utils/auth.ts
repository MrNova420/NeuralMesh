import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'development-refresh-secret-change-in-production';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

// Generate access token (short-lived, 15 minutes)
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Generate refresh token (long-lived, 7 days)
export function generateRefreshToken(payload: TokenPayload): string {
  const jti = randomBytes(16).toString('hex');
  return jwt.sign({ ...payload, jti }, REFRESH_SECRET, { expiresIn: '7d' });
}

// Verify access token
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload & { jti: string } {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload & { jti: string };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Compare password with hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Extract token from header
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

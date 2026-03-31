import { nanoid, customAlphabet } from 'nanoid';
import { createHash } from 'crypto';

export const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
export const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const inviteAlphabet = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export function generateSessionId(): string {
  return nanoid(40);
}

export function generateInviteCode(): string {
  const raw = inviteAlphabet();
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function generateResetToken(): string {
  return nanoid(32);
}

const verificationAlphabet = customAlphabet('0123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

export function generateVerificationCode(): string {
  return verificationAlphabet();
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

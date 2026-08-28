import crypto from 'crypto';
import type { Address } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes standard for GCM

/**
 * Returns a 32-byte Buffer key derived from the environment encryption secret or Firebase credentials.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PROJECT_ID || 'flexformfitness-secure-key-2026-production';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Output format: enc:ivHex:authTagHex:encryptedHex
 */
export function encrypt(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return text as any;
  if (text.startsWith('enc:')) return text; // Already encrypted

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Encryption failed:', err);
    return text;
  }
}

/**
 * Decrypts a ciphertext string created by encrypt().
 * Backwards compatible: returns the original string if it is not encrypted or if decryption fails.
 */
export function decrypt(cipherText: string | null | undefined): string {
  if (!cipherText || typeof cipherText !== 'string') return cipherText as any;
  if (!cipherText.startsWith('enc:')) return cipherText; // Plaintext fallback

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 4) return cipherText;

    const [, ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Decryption failed:', err);
    return cipherText;
  }
}

/**
 * Encrypts sensitive fields in an Address object.
 */
export function encryptAddress(addr: Address | null | undefined): Address | null | undefined {
  if (!addr || typeof addr !== 'object') return addr;
  return {
    ...addr,
    line1: addr.line1 ? encrypt(addr.line1) : '',
    line2: addr.line2 ? encrypt(addr.line2) : null,
    city: addr.city ? encrypt(addr.city) : '',
    state: addr.state ? encrypt(addr.state) : '',
    postal_code: addr.postal_code ? encrypt(addr.postal_code) : '',
    country: addr.country ? encrypt(addr.country) : '',
  };
}

/**
 * Decrypts sensitive fields in an Address object.
 */
export function decryptAddress(addr: Address | null | undefined): Address | null | undefined {
  if (!addr || typeof addr !== 'object') return addr;
  return {
    ...addr,
    line1: addr.line1 ? decrypt(addr.line1) : '',
    line2: addr.line2 ? decrypt(addr.line2) : null,
    city: addr.city ? decrypt(addr.city) : '',
    state: addr.state ? decrypt(addr.state) : '',
    postal_code: addr.postal_code ? decrypt(addr.postal_code) : '',
    country: addr.country ? decrypt(addr.country) : '',
  };
}

/**
 * Encrypts customer details object (including phone and address).
 */
export function encryptCustomerDetails(details: any): any {
  if (!details || typeof details !== 'object') return details;
  return {
    ...details,
    phone: details.phone ? encrypt(details.phone) : details.phone,
    address: details.address ? encryptAddress(details.address) : details.address,
  };
}

/**
 * Decrypts customer details object (including phone and address).
 */
export function decryptCustomerDetails(details: any): any {
  if (!details || typeof details !== 'object') return details;
  return {
    ...details,
    phone: details.phone ? decrypt(details.phone) : details.phone,
    address: details.address ? decryptAddress(details.address) : details.address,
  };
}

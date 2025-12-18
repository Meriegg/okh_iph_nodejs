import crypto from 'crypto';

export const generateSecureRandomString = (): string => {
  return crypto.randomBytes(32).toString('hex');
}
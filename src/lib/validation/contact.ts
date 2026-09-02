import { isValidPhoneNumber, validatePhoneNumberLength } from 'libphonenumber-js';

export type PhoneIssue = 'empty' | 'tooShort' | 'tooLong' | 'invalid';
export type EmailIssue = 'empty' | 'missingAt' | 'missingDomain' | 'invalid';

/** Checks an E.164 number (the shape PhoneField commits) and names what is wrong with it. */
export function checkPhone(value: string): PhoneIssue | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'empty';
  if (isValidPhoneNumber(value)) return null;

  const length = validatePhoneNumberLength(value);
  if (length === 'TOO_SHORT') return 'tooShort';
  if (length === 'TOO_LONG') return 'tooLong';
  return 'invalid';
}

export function checkEmail(value: string): EmailIssue | null {
  const email = value.trim();
  if (!email) return 'empty';

  const parts = email.split('@');
  if (parts.length === 1) return 'missingAt';
  if (parts.length > 2) return 'invalid';

  const [local, domain] = parts;
  if (!local || /\s/.test(email)) return 'invalid';
  if (!domain) return 'missingDomain';
  if (!domain.includes('.')) return 'missingDomain';
  if (!/^[^\s@]+\.[^\s@.]+$/.test(domain)) return 'invalid';

  return null;
}

import type { CardBrand } from './types';

// Kart bilgisi yalnızca tarayıcıda doğrulanır; sunucuya sadece tür ve son 4 hane gider.

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

export function detectBrand(number: string): CardBrand {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^9792/.test(n)) return 'troy';
  return 'kart';
}

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  troy: 'Troy',
  kart: 'Kart',
};

// "4242424242424242" -> "4242 4242 4242 4242" (Amex: 4-6-5)
export function formatCardNumber(value: string) {
  const n = digitsOnly(value).slice(0, 19);
  if (detectBrand(n) === 'amex') return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ');
  return n.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// "1228" -> "12/28"
export function formatExpiry(value: string) {
  const n = digitsOnly(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

// Luhn algoritması: kart numarasının yazım hatası içerip içermediğini kontrol eder
export function passesLuhn(number: string) {
  const n = digitsOnly(number);
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return n.length > 0 && sum % 10 === 0;
}

export interface CardErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
  holder?: string;
}

export function validateCard(card: { holder: string; number: string; expiry: string; cvc: string }, now = new Date()) {
  const errors: CardErrors = {};
  const number = digitsOnly(card.number);
  const brand = detectBrand(number);

  if (!card.holder.trim()) errors.holder = 'Kart üzerindeki ismi girin.';

  if (number.length < 13 || number.length > 19 || !passesLuhn(number)) errors.number = 'Geçerli bir kart numarası girin.';

  const [mm, yy] = card.expiry.split('/');
  const month = Number(mm);
  const year = 2000 + Number(yy);
  if (!/^\d{2}\/\d{2}$/.test(card.expiry) || month < 1 || month > 12) {
    errors.expiry = 'AA/YY biçiminde girin.';
  } else if (new Date(year, month, 1) <= new Date(now.getFullYear(), now.getMonth(), 1)) {
    errors.expiry = 'Kartın son kullanma tarihi geçmiş.';
  }

  const cvcLength = brand === 'amex' ? 4 : 3;
  if (digitsOnly(card.cvc).length !== cvcLength) errors.cvc = `${cvcLength} haneli güvenlik kodunu girin.`;

  return errors;
}

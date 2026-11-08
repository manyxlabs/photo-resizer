// Money helpers for the rent receipt and GST invoice tools. Amounts are whole paise, so totals never drift.

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

/** "₹12,34,567.50", with Indian digit grouping. */
export const rupees = (paise: number) => inr.format(paise / 100);

/** Rupees as typed, commas allowed, to whole paise; NaN for anything else, so a bad amount can never be totalled. */
export function toPaise(text: string): number {
  const t = text.trim().replace(/,/g, '');
  const paise = /^(\d+(\.\d{0,2})?|\.\d{1,2})$/.test(t) ? Math.round(Number(t) * 100) : NaN;
  return Number.isSafeInteger(paise) ? paise : NaN;
}

// toPrecision drops float noise such as 1.5 * 99.99 = 149.98499999999999, so it rounds like the hand sum does.
export const roundPaise = (x: number) => Math.round(Number(x.toPrecision(12)));

const ONES = 'Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen'.split(' ');
const TENS = '- - Twenty Thirty Forty Fifty Sixty Seventy Eighty Ninety'.split(' ');

const tens = (n: number) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ''));

function indian(n: number): string {
  const parts: string[] = [];
  // Past 99 crore the count of crores is itself spoken in lakhs and thousands, as on a cheque.
  if (n >= 1e7) parts.push(`${indian(Math.floor(n / 1e7))} Crore`);
  n %= 1e7;
  for (const [size, name] of [[1e5, 'Lakh'], [1e3, 'Thousand'], [100, 'Hundred']] as const) {
    if (n >= size) parts.push(`${tens(Math.floor(n / size))} ${name}`);
    n %= size;
  }
  if (n) parts.push(tens(n));
  return parts.join(' ');
}

/** "Rupees Twelve Thousand Five Hundred and Fifty Paise Only". */
export function inWords(paise: number): string {
  if (!Number.isSafeInteger(paise) || paise < 0) throw new RangeError(`Not a paise amount: ${paise}`);
  const r = Math.floor(paise / 100);
  const p = paise % 100;
  return `Rupees ${r ? indian(r) : 'Zero'}${p ? ` and ${tens(p)} ${p === 1 ? 'Paisa' : 'Paise'}` : ''} Only`;
}

/** GST state codes, the first two characters of a GSTIN. */
export const STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu (old)',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

const BASE36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The 15th character of a GSTIN: GSTN's mod-36 Luhn over the first 14, weighting every second one by 2. */
export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = BASE36.indexOf(first14[i]!) * (i % 2 ? 2 : 1);
    sum += Math.floor(v / 36) + (v % 36);
  }
  return BASE36[(36 - (sum % 36)) % 36]!;
}

/** Why a GSTIN is not valid, or '' when it is. Expects it trimmed and upper-cased. */
/** What is wrong with a GSTIN, if anything; the page words it in its language. */
export function gstinError(gstin: string): 'format' | 'state' | 'check' | '' {
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) return 'format';
  if (!STATES[gstin.slice(0, 2)]) return 'state';
  if (gstinCheckChar(gstin) !== gstin[14]) return 'check';
  return '';
}

export const gstinState = (gstin: string) => gstin.slice(0, 2);

/** Union territories without a legislature, where UTGST takes the place of SGST (UTGST Act, 2017, s. 2(i)). */
export const UTGST_STATES = new Set(['04', '25', '26', '31', '35', '38', '97']);

export const isPan = (pan: string) => /^[A-Z]{5}\d{4}[A-Z]$/.test(pan);

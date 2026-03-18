// SplitLens — Currency & Open Exchange API utilities
// Uses exchangerate-api.com (free tier: 1,500 requests/month)
// Set your key in app.config.js as EXPO_PUBLIC_FX_KEY

const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const API_KEY  = process.env.EXPO_PUBLIC_FX_KEY ?? 'demo';

let _rateCache = null;
let _cacheTime  = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ─── Fetch latest rates (INR base) ───────────────────────
export async function fetchRates(base = 'INR') {
  const now = Date.now();
  if (_rateCache && now - _cacheTime < CACHE_TTL) {
    return _rateCache;
  }

  try {
    const res  = await fetch(`${BASE_URL}/${API_KEY}/latest/${base}`);
    const json = await res.json();
    if (json.result !== 'success') throw new Error(json['error-type']);
    _rateCache = json.conversion_rates;
    _cacheTime = now;
    return _rateCache;
  } catch (err) {
    console.warn('fetchRates failed, using fallback', err);
    return FALLBACK_RATES;
  }
}

// ─── Convert amount ───────────────────────────────────────
export async function convert(amount, from, to) {
  if (from === to) return amount;
  const rates = await fetchRates(from);
  const rate  = rates[to];
  if (!rate) throw new Error(`Unknown currency: ${to}`);
  return +(amount * rate).toFixed(2);
}

// ─── Format currency ──────────────────────────────────────
export function formatCurrency(amount, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style:    'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${SYMBOLS[currency] ?? currency} ${amount.toFixed(0)}`;
  }
}

// ─── Popular currencies for UI picker ────────────────────
export const POPULAR_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹' },
  { code: 'USD', name: 'US Dollar',          symbol: '$' },
  { code: 'EUR', name: 'Euro',               symbol: '€' },
  { code: 'GBP', name: 'British Pound',      symbol: '£' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$' },
  { code: 'THB', name: 'Thai Baht',          symbol: '฿' },
];

const SYMBOLS = Object.fromEntries(POPULAR_CURRENCIES.map(c => [c.code, c.symbol]));

// Static fallback (INR base, approximate 2026 rates)
const FALLBACK_RATES = {
  USD: 0.01205, EUR: 0.01108, GBP: 0.00952,
  AED: 0.04423, SGD: 0.01620, JPY: 1.8120,
  CAD: 0.01643, AUD: 0.01880, THB: 0.41800,
  INR: 1,
};

// ─── Split calculation helpers ───────────────────────────
export function splitEqual(total, memberCount) {
  const share = total / memberCount;
  return Array(memberCount).fill(+(share.toFixed(2)));
}

export function splitPercentage(total, percentages) {
  return percentages.map(p => +((total * p) / 100).toFixed(2));
}

export function splitExact(total, amounts) {
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - total) > 1) throw new Error('Amounts do not add up to total');
  return amounts;
}

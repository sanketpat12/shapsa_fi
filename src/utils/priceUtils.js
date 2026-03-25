/**
 * Format a price (in dollars/base units) as Indian Rupees.
 * Conversion: 1 USD ≈ 83 INR (approximate)
 * Uses the Indian numbering system (lakhs/crores) via Intl.NumberFormat.
 */
export const USD_TO_INR = 83;

export function formatPrice(usdAmount, options = {}) {
  const { showSymbol = true, convert = true } = options;
  const inr = convert ? Math.round(usdAmount * USD_TO_INR) : usdAmount;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(inr);
  return showSymbol ? `₹${formatted}` : formatted;
}

export default formatPrice;

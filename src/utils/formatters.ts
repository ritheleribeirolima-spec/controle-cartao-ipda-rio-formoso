/**
 * Utilities for formatting currency and numbers in Brazilian Real (BRL)
 */

export function formatCurrency(cents: number): string {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses user input (string or number) into integer centavos.
 * Handles formats like: "3000", "3.000,00", "3000,00", "3000.00"
 */
export function parseCurrencyToCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  if (!input) return 0;
  
  // Clean spaces
  let cleaned = input.trim().replace(/^R\$\s?/, '');
  
  // If format is 3.000,00 -> remove dots, replace comma with dot
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
}

/**
 * Format cents directly into a clean decimal string for input fields (e.g. 1346.94 -> "1346,94")
 */
export function centsToDecimalString(cents: number): string {
  const val = (cents || 0) / 100;
  return val.toFixed(2).replace('.', ',');
}

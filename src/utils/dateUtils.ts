/**
 * Utilities for date formatting and manipulation in pt-BR
 */

export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return '—';
  // If dateStr is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function toISODateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds months to a YYYY-MM-DD date preserving the day of month,
 * clamping if the target month has fewer days.
 */
export function addMonthsToISODate(baseDateStr: string, monthsToAdd: number): string {
  const parts = baseDateStr.split('-');
  if (parts.length !== 3) return baseDateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const originalDay = parseInt(parts[2], 10);

  const targetDate = new Date(year, month + monthsToAdd, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  // Find max days in target month
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const adjustedDay = Math.min(originalDay, daysInTargetMonth);

  const finalMonthStr = String(targetMonth + 1).padStart(2, '0');
  const finalDayStr = String(adjustedDay).padStart(2, '0');

  return `${targetYear}-${finalMonthStr}-${finalDayStr}`;
}

const MONTH_NAMES_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getMonthYearLabel(year: number, monthZeroIndexed: number): string {
  const monthName = MONTH_NAMES_BR[monthZeroIndexed] || '';
  return `${monthName} de ${year}`;
}

export function getMonthName(monthZeroIndexed: number): string {
  return MONTH_NAMES_BR[monthZeroIndexed] || '';
}

/**
 * Checks if a due date is in the past relative to a reference date.
 * Compares calendar dates (YYYY-MM-DD) lexicographically.
 */
export function isDateInPast(dueDateStr: string, referenceDateStr?: string): boolean {
  if (!dueDateStr) return false;
  const ref = referenceDateStr || toISODateString(new Date());
  return dueDateStr < ref;
}

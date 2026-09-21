/**
 * Normalizes Czech text for searching:
 * - strips accents/diacritics (á->a, č->c, ř->r, ž->z, etc.)
 * - converts to lowercase
 * - collapses extra whitespaces
 */
export function normalizeCzech(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a promotional validity date has passed (compared to current date).
 * Defaults to current local date if not specified.
 */
export function isPromotionActive(validTo: string, currentDate: Date = new Date()): boolean {
  if (!validTo) return true;
  // Parse YYYY-MM-DD
  const [year, month, day] = validTo.split('-').map(Number);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  return endOfDay.getTime() >= currentDate.getTime();
}

/**
 * Formats Czech date in human readable format, e.g. "středa 24. 9." or "do 24. 9."
 */
export function formatCzechDate(validTo: string): string {
  if (!validTo) return '';
  const [year, month, day] = validTo.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const weekdays = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
  const dayName = weekdays[date.getDay()];
  
  return `do ${dayName} ${day}. ${month}.`;
}

/**
 * Formats price in Czech Koruna with comma separator.
 */
export function formatCzk(price: number): string {
  return price.toLocaleString('cs-CZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' Kč';
}

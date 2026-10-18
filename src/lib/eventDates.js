/**
 * Date helpers for events. Event dates are "YYYY-MM-DD" strings in Stockholm
 * local time; endDate is set for multi-day events (markets, exhibitions).
 */

export function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function localToday() {
  return toDateKey(new Date());
}

// new Date("YYYY-MM-DD") parses as UTC midnight; this keeps it local
export function parseLocalDate(key) {
  const [y, m, d] = String(key).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function firstDay(event) {
  return String(event.date || '').slice(0, 10);
}

export function lastDay(event) {
  const start = firstDay(event);
  const end = String(event.endDate || '').slice(0, 10);
  return end > start ? end : start;
}

export function isMultiDay(event) {
  return lastDay(event) !== firstDay(event);
}

// Started before today and still running
export function isOngoing(event, today = localToday()) {
  return firstDay(event) < today && lastDay(event) >= today;
}

// Runs on at least one day in [from, to], both inclusive date keys
export function runsBetween(event, from, to) {
  return firstDay(event) <= to && lastDay(event) >= from;
}

// Upcoming first by the next day the event runs; on the same day, events
// starting that day come before ones that have been running for a while
export function compareByNextDay(a, b, today = localToday()) {
  const nextA = firstDay(a) > today ? firstDay(a) : today;
  const nextB = firstDay(b) > today ? firstDay(b) : today;
  if (nextA !== nextB) return nextA < nextB ? -1 : 1;
  return firstDay(b).localeCompare(firstDay(a));
}

export function formatEventDates(event, locale, options) {
  const fmt = new Intl.DateTimeFormat(locale, options);
  const start = parseLocalDate(firstDay(event));
  if (!isMultiDay(event)) return fmt.format(start);
  const end = parseLocalDate(lastDay(event));
  return fmt.formatRange ? fmt.formatRange(start, end) : `${fmt.format(start)} – ${fmt.format(end)}`;
}

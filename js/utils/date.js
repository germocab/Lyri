/**
 * Date utilities
 * The app organizes everything around a "day key": YYYY-MM-DD
 * derived from the user's LOCAL time, not UTC — a board should
 * change at local midnight, not at UTC midnight.
 */

/** Returns today's day key, e.g. "2026-07-22" */
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Formats a day key as "Wednesday, July 22nd" */
export function formatDayKeyLong(dayKey) {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'long' });
  return `${weekday}, ${month} ${ordinal(d)}`;
}

/** Formats a timestamp as a short time, e.g. "9:41 AM" */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Adds the correct ordinal suffix to a day number */
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** True if a given day key refers to today */
export function isToday(dayKey) {
  return dayKey === todayKey();
}

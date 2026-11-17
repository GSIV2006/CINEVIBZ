export function dateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
export function weekKey(date = new Date()): string {
  const d = new Date(dateKey(date) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function previousDay(key: string) {
  return new Date(Date.parse(key + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
}
export function hash(value: string) {
  let h = 2166136261;
  for (const c of value) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function seeded<T>(items: T[], key: string, id: (item: T) => string) {
  return [...items].sort(
    (a, b) => hash(key + id(a)) - hash(key + id(b)) || id(a).localeCompare(id(b)),
  );
}

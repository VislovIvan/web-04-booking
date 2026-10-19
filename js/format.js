// Даты, деньги и падежи для интерфейса

const pad = (n) => String(n).padStart(2, '0');

// Ключ даты по местному времени: 2026-10-21
export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

const weekdayShort = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const weekdayLong = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayMonthShort = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

export const weekday = (key) => weekdayShort.format(parseKey(key));

// «ср, 21 октября»
export const formatDate = (key) => `${weekday(key)}, ${dayMonth.format(parseKey(key))}`;

// «21 окт.»
export const shortDate = (key) => dayMonthShort.format(parseKey(key));

// «среда, 21 октября»
export const formatDateLong = (key) =>
  `${weekdayLong.format(parseKey(key))}, ${dayMonth.format(parseKey(key))}`;

export const slotRange = (slot) => `с ${slot.start}:00 до ${slot.end}:00`;

export const slotRangeShort = (slot) => `с ${slot.start} до ${slot.end}`;

export const slotHours = (slot) => slot.end - slot.start;

const money = new Intl.NumberFormat('ru-RU');

export const rub = (value) => `${money.format(value)} ₽`;

export function plural(n, [one, few, many]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const capacityText = (seats) => (seats === 1 ? 'на одного' : `до ${seats} человек`);

export const guestsText = (n) => `${n} ${plural(n, ['гость', 'гостя', 'гостей'])}`;

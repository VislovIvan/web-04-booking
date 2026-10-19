// Состояние приложения: сеанс, выбор, фильтры и брони

import { PLACES, SLOTS, DAYS_AHEAD } from './data.js';
import { dateKey, parseKey, addDays } from './format.js';

export const state = {
  session: null,
  filters: { seats: 1, price: 0 },
  selectedId: null,
  bookings: [],
};

export const placeById = (id) => PLACES.find((place) => place.id === id);
export const slotById = (id) => SLOTS.find((slot) => slot.id === id);

export function dayKeys(now = new Date()) {
  return Array.from({ length: DAYS_AHEAD }, (_, i) => dateKey(addDays(now, i)));
}

// Слот закрыт для брони с момента его начала
export function slotStarted(date, slotId, now = new Date()) {
  const start = parseKey(date);
  start.setHours(slotById(slotId).start);
  return now >= start;
}

export function firstOpenSession(now = new Date()) {
  for (const date of dayKeys(now)) {
    const slot = SLOTS.find((item) => !slotStarted(date, item.id, now));
    if (slot) return { date, slot: slot.id };
  }
}

// FNV-1a: число из строки «дата|слот»
function hash(text) {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.codePointAt(0), 16777619);
  return h >>> 0;
}

// mulberry32: повторяемая последовательность от одного зерна
function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const demoCache = new Map();

// Демо-занятость: 2 или 3 места на слот, одинаковые после обновления страницы
export function demoBusy(date, slotId) {
  const key = `${date}|${slotId}`;
  if (!demoCache.has(key)) {
    const random = seededRandom(hash(key));
    const ids = PLACES.map((place) => place.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    demoCache.set(key, ids.slice(0, random() < 0.5 ? 2 : 3));
  }
  return demoCache.get(key);
}

export const bookingAt = (placeId, { date, slot } = state.session) =>
  state.bookings.find((item) => item.placeId === placeId && item.date === date && item.slot === slot);

export const isBusy = (placeId, session = state.session) =>
  demoBusy(session.date, session.slot).includes(placeId) || Boolean(bookingAt(placeId, session));

export const matchesFilters = (place, { seats, price } = state.filters) =>
  place.seats >= seats && (!price || place.price <= price);

export function placeStatus(place) {
  if (isBusy(place.id)) return 'busy';
  return place.id === state.selectedId ? 'selected' : 'free';
}

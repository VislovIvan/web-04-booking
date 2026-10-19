// Состояние приложения: сеанс, выбор, фильтры и брони

import { PLACES, SLOTS, DAYS_AHEAD } from './data.js';
import { dateKey, parseKey, addDays } from './format.js';

const DEFAULT_FILTERS = { seats: 1, price: 0 };

export const state = {
  session: null,
  filters: { ...DEFAULT_FILTERS },
  selectedId: null,
  bookings: [],
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
}

function emit() {
  listeners.forEach((listener) => listener());
}

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

export function slotEnded(date, slotId, now = new Date()) {
  const end = parseKey(date);
  end.setHours(slotById(slotId).end);
  return now >= end;
}

export const dayOpen = (date, now = new Date()) => SLOTS.some((slot) => !slotStarted(date, slot.id, now));

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

// Повторное нажатие на выбранное место снимает выбор
export function toggleSelect(id) {
  const place = placeById(id);
  if (!place || !matchesFilters(place) || isBusy(id)) return;
  state.selectedId = state.selectedId === id ? null : id;
  emit();
}

export function clearSelection() {
  if (state.selectedId === null) return;
  state.selectedId = null;
  emit();
}

// Смена дня или слота; на сегодня начавшийся слот меняется на ближайший открытый
export function setSession({ date = state.session.date, slot = state.session.slot }) {
  const now = new Date();
  if (!dayKeys(now).includes(date) || !dayOpen(date, now) || !slotById(slot)) return;
  const open = slotStarted(date, slot, now) ? SLOTS.find((item) => !slotStarted(date, item.id, now)).id : slot;
  state.session = { date, slot: open };
  emit();
}

// Возвращает место, если фильтр скрыл выбранное и выбор пришлось снять
export function setFilters(patch) {
  state.filters = { ...state.filters, ...patch };
  const selected = placeById(state.selectedId);
  const hidden = selected && !matchesFilters(selected) ? selected : null;
  if (hidden) state.selectedId = null;
  emit();
  return hidden;
}

export const resetFilters = () => setFilters(DEFAULT_FILTERS);

// Гостей: целое число от 1 до вместимости места
export function parseGuests(raw, seats) {
  const text = String(raw).trim();
  if (text === '') return { error: `Укажите число гостей: от 1 до ${seats}.` };
  if (!/^-?\d+$/.test(text)) return { error: 'Нужно целое число, без дробей и букв.' };
  const value = Number(text);
  if (value < 1 || value > seats) return { error: `Гостей может быть от 1 до ${seats}.` };
  return { value };
}

// Ошибки формы по полям: place, slot, guests
export function validate(guestsRaw, now = new Date()) {
  const errors = {};
  const place = placeById(state.selectedId);
  const { date, slot } = state.session;
  if (!place) errors.place = 'Выберите место на плане или в списке.';
  if (slotStarted(date, slot, now)) {
    errors.slot = slotEnded(date, slot, now)
      ? 'Этот слот уже прошёл, выберите другое время.'
      : 'Этот слот уже начался, выберите другое время.';
  } else if (place && isBusy(place.id)) {
    errors.slot = 'Место занято в это время, выберите другое время или место.';
  }
  if (place) {
    const guests = parseGuests(guestsRaw, place.seats);
    if (guests.error) errors.guests = guests.error;
  }
  return errors;
}

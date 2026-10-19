// Карточка выбранного места: описание, форма и итоговая сумма

import { SLOTS } from './data.js';
import {
  state, placeById, slotById, dayKeys, dayOpen, slotStarted, slotEnded, setSession, validate, book,
} from './store.js';
import { el } from './ui.js';
import {
  rub, capacityText, slotHours, slotRange, slotRangeShort, shortDate, weekday, formatDate,
} from './format.js';

export function createCard(root, { onBooked }) {
  const $ = (selector) => root.querySelector(selector);
  const form = $('#bookingForm');
  const name = $('#chosenName');
  const meta = $('#chosenMeta');
  const details = $('#chosenDetails');
  const text = $('#chosenText');
  const features = $('#chosenFeatures');
  const placeError = $('#placeError');
  const dateSelect = $('#formDate');
  const slotSelect = $('#formSlot');
  const slotError = $('#slotError');
  const guests = $('#guests');
  const guestsHint = $('#guestsHint');
  const guestsError = $('#guestsError');
  const sum = $('#totalSum');
  const calc = $('#totalCalc');
  const confirm = $('#confirm');
  const status = $('#formStatus');

  let shownDays = '';
  let shownPlace = null;
  let guestsTouched = false;
  // После брони кнопка ждёт новых данных: так двойное нажатие не создаст дубль
  let lockKey = null;

  const formKey = () => `${state.session.date}|${state.session.slot}|${state.selectedId}`;

  function unlock() {
    if (lockKey === null) return;
    lockKey = null;
    confirm.removeAttribute('aria-disabled');
    status.replaceChildren();
  }

  function showSuccess(booking, place) {
    const slot = slotById(booking.slot);
    const link = el('a', 'link', 'Перейти к моим броням');
    link.href = '#bookings';
    status.replaceChildren(
      `Бронь ${booking.id} оформлена: ${place.name}, ${formatDate(booking.date)}, ${slot.name.toLowerCase()} ${slotRange(slot)}, ${rub(booking.total)}. `,
      link,
    );
  }

  const slotOptions = SLOTS.map((slot) => new Option(slot.name, slot.id));
  slotSelect.append(...slotOptions);

  function setError(node, field, message = '') {
    node.textContent = message;
    field?.setAttribute('aria-invalid', String(Boolean(message)));
  }

  const showGuestsError = () => setError(guestsError, guests, validate(guests.value).guests);

  dateSelect.addEventListener('change', () => setSession({ date: dateSelect.value }));
  slotSelect.addEventListener('change', () => setSession({ slot: slotSelect.value }));
  guests.addEventListener('input', () => {
    if (guestsTouched) showGuestsError();
  });
  guests.addEventListener('change', () => {
    guestsTouched = true;
    showGuestsError();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (lockKey !== null) return;
    guestsTouched = true;
    const place = placeById(state.selectedId);
    const { errors, booking } = book(guests.value);
    if (errors) {
      setError(placeError, null, errors.place);
      setError(slotError, slotSelect, errors.slot);
      setError(guestsError, guests, errors.guests);
      if (errors.guests) guests.focus();
      else if (errors.slot) slotSelect.focus();
      return;
    }
    lockKey = formKey();
    confirm.setAttribute('aria-disabled', 'true');
    showSuccess(booking, place);
    onBooked(booking);
  });

  function renderDates() {
    const keys = dayKeys();
    if (keys.join() === shownDays) return;
    shownDays = keys.join();
    dateSelect.replaceChildren(
      ...keys.map((key) => new Option(`${weekday(key)}, ${shortDate(key)}`, key)),
    );
  }

  function renderPlace(place) {
    if ((place?.id ?? null) !== shownPlace) {
      shownPlace = place?.id ?? null;
      guests.value = '1';
      guestsTouched = false;
      setError(guestsError, guests);
    }
    name.textContent = place ? place.name : 'Место не выбрано';
    meta.textContent = place
      ? `${place.type} · ${capacityText(place.seats)} · ${rub(place.price)} в час`
      : 'Нажмите на свободное место на плане или в списке.';
    details.hidden = !place;
    if (!place) return;
    text.textContent = place.description;
    features.replaceChildren(...place.features.map((feature) => el('li', 'tag', feature)));
    setError(placeError, null);
  }

  function renderSession(now) {
    const { date, slot } = state.session;
    renderDates();
    for (const option of dateSelect.options) option.disabled = !dayOpen(option.value, now);
    dateSelect.value = date;
    slotOptions.forEach((option, index) => {
      const item = SLOTS[index];
      const started = slotStarted(date, item.id, now);
      const note = slotEnded(date, item.id, now) ? 'прошёл' : 'уже идёт';
      option.disabled = started;
      option.textContent = `${item.name}, ${started ? note : slotRangeShort(item)}`;
    });
    slotSelect.value = slot;
    // Занятость и прошедшее время видны сразу, не дожидаясь подтверждения
    setError(slotError, slotSelect, validate(guests.value, now).slot);
  }

  function renderGuests(place) {
    const group = Boolean(place && place.seats > 1);
    guests.disabled = !group;
    if (!group) guests.value = '1';
    if (!place) guestsHint.textContent = 'Сначала выберите место.';
    else guestsHint.textContent = group ? `От 1 до ${place.seats} человек.` : 'Место на одного человека.';
  }

  function renderTotal(place) {
    const slot = slotById(state.session.slot);
    const hours = slotHours(slot);
    sum.textContent = rub(place ? place.price * hours : 0);
    calc.textContent = place
      ? `${rub(place.price)} × ${hours} ч, ${slot.name.toLowerCase()} ${slotRange(slot)}`
      : 'Сумма появится после выбора места.';
  }

  function update() {
    if (lockKey !== null && formKey() !== lockKey) unlock();
    const place = placeById(state.selectedId);
    renderPlace(place);
    renderSession(new Date());
    renderGuests(place);
    renderTotal(place);
  }

  return { update };
}

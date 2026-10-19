// «Мои брони»: записи по порядку дат и отмена с подтверждением на странице

import { SLOTS } from './data.js';
import { state, placeById, slotById, slotEnded, cancelBooking, resetDemo } from './store.js';
import { el, askInline } from './ui.js';
import { formatDate, slotRange, rub, guestsText } from './format.js';

const slotIndex = (id) => SLOTS.findIndex((slot) => slot.id === id);

// Сначала будущие по дате и слоту, прошедшие в конце
const sortKey = (booking) =>
  `${slotEnded(booking.date, booking.slot) ? 1 : 0}|${booking.date}|${slotIndex(booking.slot)}`;

export function createBookings(root, { counter }) {
  const list = root.querySelector('#bookingList');
  const empty = root.querySelector('#bookingsEmpty');
  const status = root.querySelector('#bookingsStatus');
  const heading = root.querySelector('#bookingsTitle');
  const reset = root.querySelector('#resetDemo');
  const resetConfirm = root.querySelector('#resetConfirm');
  const rows = new Map();

  reset.addEventListener('click', () => {
    status.textContent = '';
    askInline(resetConfirm, {
      question: 'Удалить все брони и вернуть фильтры и дату по умолчанию?',
      yes: 'Да, сбросить',
      onYes: () => {
        resetDemo();
        status.textContent = 'Демо сброшено: броней нет, места свободны по демо-расписанию.';
        heading.focus();
      },
      trigger: reset,
    });
  });

  function cancel(booking) {
    const removed = cancelBooking(booking.id);
    if (!removed) return;
    const slot = slotById(removed.slot);
    status.textContent = `Бронь ${removed.id} отменена, место снова свободно: ${placeById(removed.placeId).name}, ${formatDate(removed.date)}, ${slot.name.toLowerCase()}.`;
    heading.focus();
  }

  function createRow(booking) {
    const place = placeById(booking.placeId);
    const slot = slotById(booking.slot);
    const li = el('li', 'booking');
    li.dataset.id = booking.id;
    const button = el('button', 'btn btn-sm btn-danger', 'Отменить');
    button.type = 'button';
    const past = el('span', 'badge', 'Прошла');
    const head = el('div', 'booking-head');
    head.append(el('span', 'booking-id', booking.id), button, past);
    const confirmRow = el('div', 'confirm-row');
    li.append(
      head,
      el('p', 'booking-place', place.name),
      el('p', 'booking-when', `${formatDate(booking.date)}, ${slot.name.toLowerCase()} ${slotRange(slot)}`),
      el('p', 'booking-meta', `${guestsText(booking.guests)} · ${rub(booking.total)}`),
      confirmRow,
    );
    button.addEventListener('click', () => {
      status.textContent = '';
      askInline(confirmRow, {
        question: `Отменить бронь ${booking.id}?`,
        yes: 'Да, отменить',
        onYes: () => cancel(booking),
        trigger: button,
      });
    });
    return { li, button, past };
  }

  function update() {
    const ids = new Set(state.bookings.map((booking) => booking.id));
    for (const [id, row] of rows) {
      if (!ids.has(id)) {
        row.li.remove();
        rows.delete(id);
      }
    }
    const sorted = [...state.bookings].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    for (const booking of sorted) {
      if (!rows.has(booking.id)) rows.set(booking.id, createRow(booking));
      const row = rows.get(booking.id);
      const ended = slotEnded(booking.date, booking.slot);
      row.past.hidden = !ended;
      if (ended) row.button.hidden = true;
    }
    // Порядок меняем, только если он стал другим: так не теряется фокус
    const order = sorted.map((booking) => booking.id).join();
    if ([...list.children].map((li) => li.dataset.id).join() !== order) {
      list.replaceChildren(...sorted.map((booking) => rows.get(booking.id).li));
    }
    empty.hidden = sorted.length > 0;
    counter.textContent = String(sorted.length);
  }

  // Новая запись коротко подсвечивается, чтобы её было видно в списке
  function highlight(id) {
    const row = rows.get(id);
    if (!row) return;
    row.li.classList.add('is-new');
    row.li.addEventListener('animationend', () => row.li.classList.remove('is-new'), { once: true });
  }

  return { update, highlight };
}

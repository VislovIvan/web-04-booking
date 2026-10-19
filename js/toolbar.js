// Сеанс и фильтры: день, слот, число мест и цена за час

import { SLOTS, SEAT_OPTIONS, PRICE_OPTIONS } from './data.js';
import {
  state, dayKeys, dayOpen, slotStarted, slotEnded, setSession, setFilters, resetFilters,
} from './store.js';
import { el, radio, bindRadioGroup, syncRadioGroup } from './ui.js';
import { formatDateLong, weekday, parseKey, slotRange, slotRangeShort, rub } from './format.js';

export function createToolbar(root) {
  const days = root.querySelector('#days');
  const dayValue = root.querySelector('#dayValue');
  const slots = root.querySelector('#slots');
  const seats = root.querySelector('#seatsFilter');
  const price = root.querySelector('#priceFilter');
  const status = root.querySelector('#filterStatus');
  let shownDays = '';

  for (const value of SEAT_OPTIONS) {
    const chip = radio('chip', String(value));
    chip.textContent = value;
    seats.append(chip);
  }
  for (const value of PRICE_OPTIONS) {
    const chip = radio('chip', String(value));
    chip.textContent = value ? rub(value) : 'Любая';
    price.append(chip);
  }

  const slotItems = SLOTS.map((slot) => {
    const button = radio('tile slot', slot.id);
    const time = el('span', 'slot-time');
    button.append(el('span', 'slot-name', slot.name), time);
    slots.append(button);
    return { slot, button, time };
  });

  const showHidden = (place) => {
    status.textContent = place ? `${place.name} не подходит под фильтры, выбор снят.` : '';
  };

  bindRadioGroup(days, (date) => setSession({ date }));
  bindRadioGroup(slots, (slot) => setSession({ slot }));
  bindRadioGroup(seats, (value) => showHidden(setFilters({ seats: Number(value) })));
  bindRadioGroup(price, (value) => showHidden(setFilters({ price: Number(value) })));
  root.querySelector('#resetFilters').addEventListener('click', () => showHidden(resetFilters()));

  // Полоса дней пересобирается, только когда наступили новые сутки
  function renderDays() {
    const keys = dayKeys();
    if (keys.join() === shownDays) return;
    shownDays = keys.join();
    days.replaceChildren(
      ...keys.map((key, index) => {
        const button = radio('tile day', key);
        button.setAttribute('aria-label', `${formatDateLong(key)}${index === 0 ? ', сегодня' : ''}`);
        button.append(
          el('span', 'day-week', index === 0 ? 'Сегодня' : weekday(key)),
          el('span', 'day-num', String(parseKey(key).getDate())),
        );
        return button;
      }),
    );
  }

  function update() {
    const now = new Date();
    const { date, slot } = state.session;
    renderDays();
    for (const button of days.children) button.disabled = !dayOpen(button.dataset.value, now);
    syncRadioGroup(days, date);
    dayValue.textContent = formatDateLong(date);

    for (const item of slotItems) {
      const started = slotStarted(date, item.slot.id, now);
      item.button.disabled = started;
      // На узком экране время короче: «с 9 до 13»
      item.time.replaceChildren(
        ...(started
          ? [slotEnded(date, item.slot.id, now) ? 'прошёл' : 'уже идёт']
          : [el('span', 'wide-only', slotRange(item.slot)), el('span', 'narrow-only', slotRangeShort(item.slot))]),
      );
    }
    syncRadioGroup(slots, slot);
    syncRadioGroup(seats, String(state.filters.seats));
    syncRadioGroup(price, String(state.filters.price));
    if (state.selectedId) showHidden(null);
  }

  return { update };
}

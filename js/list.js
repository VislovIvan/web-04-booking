// Список мест: те же данные, что на плане, удобно выбирать с клавиатуры

import { PLACES } from './data.js';
import { matchesFilters, placeStatus, bookingAt, toggleSelect, clearSelection } from './store.js';
import { el, statusContent } from './ui.js';
import { rub, capacityText } from './format.js';

const BADGE = { free: 'badge-ok', selected: 'badge-accent', busy: 'badge-danger' };

export function createList({ list, count, empty }) {
  const items = PLACES.map((place) => {
    const button = el('button', 'item');
    button.type = 'button';
    button.dataset.id = place.id;
    const badge = el('span', 'badge');
    const head = el('span', 'item-head');
    head.append(el('span', 'item-name', place.name), badge);
    const note = el('span', 'item-note');
    button.append(
      head,
      el('span', 'item-meta', `${place.type} · ${capacityText(place.seats)}`),
      el('span', 'item-price', `${rub(place.price)} в час`),
      note,
    );
    const li = el('li');
    li.append(button);
    list.append(li);
    return { place, li, button, badge, note };
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('.item');
    if (button) toggleSelect(button.dataset.id);
  });
  list.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearSelection();
  });

  function update() {
    let shown = 0;
    for (const { place, li, button, badge, note } of items) {
      const value = placeStatus(place);
      const visible = matchesFilters(place);
      li.hidden = !visible;
      if (visible) shown += 1;
      button.disabled = value === 'busy';
      button.setAttribute('aria-pressed', String(value === 'selected'));
      button.classList.toggle('hatch', value === 'busy');
      badge.className = `badge ${BADGE[value]}`;
      badge.replaceChildren(...statusContent(value));
      const own = bookingAt(place.id);
      note.textContent = own ? `Ваша бронь ${own.id}` : '';
      note.hidden = !own;
    }
    count.textContent = `${shown} из ${PLACES.length}`;
    empty.hidden = shown > 0;
  }

  return { update };
}

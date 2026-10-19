// План этажа: кнопки мест поверх схемы SVG

import { PLACES } from './data.js';
import { state, matchesFilters, placeStatus, slotById, toggleSelect, clearSelection } from './store.js';
import { el, statusContent } from './ui.js';
import { formatDate, rub, slotRange } from './format.js';

export function createPlan({ layer, caption, empty }) {
  const items = PLACES.map((place) => {
    const button = el('button', 'place');
    button.type = 'button';
    button.dataset.id = place.id;
    const { x, y, w, h } = place.plan;
    Object.assign(button.style, { left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
    const status = el('span', 'place-status');
    button.append(
      el('span', 'place-name', place.short),
      el('span', 'place-price', `${rub(place.price)}/ч`),
      status,
    );
    layer.append(button);
    return { place, button, status };
  });

  layer.addEventListener('click', (event) => {
    const button = event.target.closest('.place');
    if (button) toggleSelect(button.dataset.id);
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearSelection();
  });

  function update() {
    let shown = 0;
    let free = 0;
    for (const { place, button, status } of items) {
      const value = placeStatus(place);
      const visible = matchesFilters(place);
      button.hidden = !visible;
      button.disabled = value === 'busy';
      button.setAttribute('aria-pressed', String(value === 'selected'));
      button.classList.toggle('is-busy', value === 'busy');
      button.classList.toggle('hatch', value === 'busy');
      status.replaceChildren(...statusContent(value));
      if (visible) {
        shown += 1;
        if (value !== 'busy') free += 1;
      }
    }
    empty.hidden = shown > 0;
    const slot = slotById(state.session.slot);
    caption.textContent = `Занятость на ${formatDate(state.session.date)}, ${slot.name.toLowerCase()} ${slotRange(slot)}: свободно ${free} из ${shown}.`;
  }

  return { update };
}

// Точка входа: собирает модули и перерисовывает их при изменениях

import { state, firstOpenSession, subscribe, resetFilters } from './store.js';
import { createToolbar } from './toolbar.js';
import { createPlan } from './plan.js';
import { createList } from './list.js';
import { createCard } from './card.js';
import { createBookings } from './bookings.js';

const $ = (selector) => document.querySelector(selector);

state.session = firstOpenSession();

const toolbar = createToolbar($('.controls'));

const plan = createPlan({
  layer: $('#planPlaces'),
  caption: $('#planCaption'),
  empty: $('#planEmpty'),
});

const bookings = createBookings($('#bookings'), { counter: $('#bookingsCount') });

const card = createCard($('#card'), {
  onBooked: (booking) => bookings.highlight(booking.id),
});

// На телефоне карточка стоит выше списка: после выбора в списке показываем её
const narrow = matchMedia('(width < 900px)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const list = createList({
  list: $('#placeList'),
  count: $('#listCount'),
  empty: $('#listEmpty'),
  onPicked: () => {
    if (narrow.matches) $('#card').scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' });
  },
});

$('#listResetFilters').addEventListener('click', () => {
  resetFilters();
  $('#placeList .item:not(:disabled)')?.focus();
});

function render() {
  toolbar.update();
  plan.update();
  list.update();
  card.update();
  bookings.update();
}

subscribe(render);
render();

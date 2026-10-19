// Точка входа: собирает модули и перерисовывает их при изменениях

import { state, load, subscribe, resetFilters, refresh } from './store.js';
import { createToolbar } from './toolbar.js';
import { createPlan } from './plan.js';
import { createList } from './list.js';
import { createCard } from './card.js';
import { createBookings } from './bookings.js';
import { setText } from './ui.js';
import { plural } from './format.js';

const $ = (selector) => document.querySelector(selector);

load();

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

function renderStorage() {
  const { blocked, damaged } = state.storage;
  const parts = [];
  if (damaged === 'all') {
    parts.push('Сохранённые брони не удалось прочитать: данные повреждены. Список начат заново, новые брони сохранятся как обычно.');
  } else if (damaged) {
    parts.push(`Часть сохранённых броней повреждена и пропущена: ${damaged} ${plural(damaged, ['запись', 'записи', 'записей'])}.`);
  }
  if (blocked) parts.push('Браузер не даёт сохранять данные: брони работают, пока открыта эта вкладка.');
  setText($('#storageNotice'), parts.join(' '));
}

function render() {
  toolbar.update();
  plan.update();
  list.update();
  card.update();
  bookings.update();
  renderStorage();
}

subscribe(render);
render();
setInterval(refresh, 30_000);

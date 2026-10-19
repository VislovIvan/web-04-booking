// Точка входа: собирает модули и перерисовывает их при изменениях

import { state, firstOpenSession, subscribe, resetFilters } from './store.js';
import { createToolbar } from './toolbar.js';
import { createPlan } from './plan.js';
import { createList } from './list.js';

const $ = (selector) => document.querySelector(selector);

state.session = firstOpenSession();

const toolbar = createToolbar($('.controls'));

const plan = createPlan({
  layer: $('#planPlaces'),
  caption: $('#planCaption'),
  empty: $('#planEmpty'),
});

const list = createList({
  list: $('#placeList'),
  count: $('#listCount'),
  empty: $('#listEmpty'),
});

$('#listResetFilters').addEventListener('click', () => {
  resetFilters();
  $('#placeList .item:not(:disabled)')?.focus();
});

function render() {
  toolbar.update();
  plan.update();
  list.update();
}

subscribe(render);
render();

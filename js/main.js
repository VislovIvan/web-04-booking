// Точка входа: собирает модули и перерисовывает их при изменениях

import { state, firstOpenSession } from './store.js';
import { createPlan } from './plan.js';
import { createList } from './list.js';

state.session = firstOpenSession();

const plan = createPlan({
  layer: document.querySelector('#planPlaces'),
  caption: document.querySelector('#planCaption'),
});

const list = createList({
  list: document.querySelector('#placeList'),
  count: document.querySelector('#listCount'),
});

plan.update();
list.update();

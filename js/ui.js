// Мелкие помощники для разметки

export const STATUS_TEXT = { free: 'Свободно', selected: 'Выбрано', busy: 'Занято' };
export const STATUS_ICON = { selected: 'check', busy: 'lock' };

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Текст меняем, только если он другой: живые области не повторяют одно и то же
export function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Значок из спрайта в index.html
export function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

// Группа кнопок с одним выбором: Tab заходит на выбранную, стрелки двигают выбор
export function bindRadioGroup(group, onPick) {
  group.addEventListener('click', (event) => {
    const radio = event.target.closest('[role="radio"]');
    if (radio && !radio.disabled) onPick(radio.dataset.value);
  });
  group.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const radios = [...group.querySelectorAll('[role="radio"]:not(:disabled)')];
    const index = radios.indexOf(document.activeElement);
    if (index === -1 || (!step && event.key !== 'Home' && event.key !== 'End')) return;
    event.preventDefault();
    let next = (index + (step ?? 0) + radios.length) % radios.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = radios.length - 1;
    radios[next].focus();
    onPick(radios[next].dataset.value);
  });
}

export function syncRadioGroup(group, value) {
  const radios = [...group.querySelectorAll('[role="radio"]')];
  const target =
    radios.find((radio) => radio.dataset.value === value && !radio.disabled) ??
    radios.find((radio) => !radio.disabled);
  for (const radio of radios) {
    radio.setAttribute('aria-checked', String(radio.dataset.value === value));
    radio.tabIndex = radio === target ? 0 : -1;
  }
}

export function radio(className, value) {
  const button = el('button', className);
  button.type = 'button';
  button.setAttribute('role', 'radio');
  button.dataset.value = value;
  return button;
}

// Значок состояния и подпись: «Выбрано» с галочкой, «Занято» с замком
export function statusContent(status) {
  const name = STATUS_ICON[status];
  return name ? [icon(name), STATUS_TEXT[status]] : [STATUS_TEXT[status]];
}

// Подтверждение на странице вместо confirm(): вопрос, «Да» и «Нет»
export function askInline(host, { question, yes, onYes, trigger }) {
  const yesButton = el('button', 'btn btn-sm btn-danger', yes);
  const noButton = el('button', 'btn btn-sm', 'Нет');
  yesButton.type = 'button';
  noButton.type = 'button';
  const close = () => {
    host.replaceChildren();
    trigger.hidden = false;
    trigger.focus();
  };
  yesButton.addEventListener('click', () => {
    host.replaceChildren();
    trigger.hidden = false;
    onYes();
  });
  noButton.addEventListener('click', close);
  host.onkeydown = (event) => {
    if (event.key === 'Escape') close();
  };
  host.replaceChildren(el('span', 'confirm-question', question), yesButton, noButton);
  trigger.hidden = true;
  // Фокус на «Нет»: случайное второе нажатие ничего не удалит
  noButton.focus();
}

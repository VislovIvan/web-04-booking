// Мелкие помощники для разметки

export const STATUS_TEXT = { free: 'Свободно', selected: 'Выбрано', busy: 'Занято' };
export const STATUS_ICON = { selected: 'check', busy: 'lock' };

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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

// Значок состояния и подпись: «Выбрано» с галочкой, «Занято» с замком
export function statusContent(status) {
  const name = STATUS_ICON[status];
  return name ? [icon(name), STATUS_TEXT[status]] : [STATUS_TEXT[status]];
}

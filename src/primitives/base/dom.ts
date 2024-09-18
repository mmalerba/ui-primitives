export function hasFocus(element: HTMLElement) {
  return typeof document !== 'undefined' && element.contains(document.activeElement);
}

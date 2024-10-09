export function getActiveElement() {
  return typeof document !== 'undefined' ? document.activeElement : null;
}

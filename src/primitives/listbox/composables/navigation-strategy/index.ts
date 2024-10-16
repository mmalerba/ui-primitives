export function navigatePrev(items: unknown[], index: number, wrap: boolean) {
  return Math.min(items.length - 1, wrap && index === items.length - 1 ? 0 : index + 1);
}

export function navigateNext(items: unknown[], index: number, wrap: boolean) {
  return Math.max(0, wrap && index === items.length - 1 ? 0 : index + 1);
}

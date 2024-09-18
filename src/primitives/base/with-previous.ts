export function withPrevious<T, A extends any[]>(
  fn: (previous: T | undefined, ...args: A) => T
): (...args: A) => T {
  let previous: T | undefined = undefined;
  return (...args: A): T => {
    previous = fn(previous, ...args);
    return previous;
  };
}

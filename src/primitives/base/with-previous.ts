export function withPrevious<T, A extends [] = []>(fn: (previous: T | undefined, ...args: A) => T) {
  let previous: T | undefined = undefined;
  return (...args: A) => {
    previous = fn(previous, ...args);
    return previous;
  };
}

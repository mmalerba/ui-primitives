export function withPrevious<T>(fn: (previous: T | undefined) => T) {
  let previous: T | undefined = undefined;
  return () => {
    previous = fn(previous);
    return previous;
  };
}

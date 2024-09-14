import { isSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { Behavior } from './behavior';
import { derivedSignal } from './derived-signal';
import { withPrevious } from './with-previous';

export type UnwrapSignal<T extends Signal<any>> = T extends Signal<infer U> ? U : never;

export type Extendable<T extends Signal<any>> = T & {
  extend: (
    behavior: Behavior,
    fn: (parent: UnwrapSignal<T>) => UnwrapSignal<T>
  ) => WritableSignal<UnwrapSignal<T>>;
};

export type ExtendableState<T extends object = object> = {
  [K in keyof T]: T[K] extends Signal<any> ? Extendable<T[K]> : T[K];
};

export function createExtendableState<T extends { [k: string]: any }>(
  state: T
): ExtendableState<T> {
  const stateSignal = signal(state);
  return new Proxy(state, {
    get(_, property) {
      const result = Reflect.get(stateSignal(), property);
      if (isSignal(result)) {
        const s = result as unknown as Extendable<Signal<unknown>>;
        s.extend = (behavior: Behavior, fn: (value: unknown) => unknown) => {
          const derived = derivedSignal(
            withPrevious((previous) =>
              behavior.removed() ? previous ?? untracked(() => s()) : fn(s())
            )
          );
          untracked(() => stateSignal.update((old) => ({ ...old, [property]: derived })));
          return derived;
        };
        return s;
      } else {
        return result;
      }
    },
  }) as ExtendableState<T>;
}

import { isSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';
import { derivedSignal } from './derived-signal';

export type UnwrapSignal<T extends Signal<any>> = T extends Signal<infer U> ? U : never;

export type Extenable<T extends Signal<any>> = T & {
  extend: (fn: (parent: UnwrapSignal<T>) => UnwrapSignal<T>) => WritableSignal<UnwrapSignal<T>>;
};

export type ExtendableState<T extends object = object> = {
  [K in keyof T]: T[K] extends Signal<any> ? Extenable<T[K]> : T[K];
};

export function createExtendableState<T extends { [k: string]: any }>(
  state: T
): ExtendableState<T> {
  const stateSignal = signal(state);
  return new Proxy(state, {
    get(_, property) {
      const result = Reflect.get(stateSignal(), property);
      if (isSignal(result)) {
        const s = result as unknown as Extenable<Signal<unknown>>;
        s.extend = (fn: (value: unknown) => unknown) => {
          const derived = derivedSignal(() => fn(s()));
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

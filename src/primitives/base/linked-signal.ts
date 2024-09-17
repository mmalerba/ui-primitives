import { computed, signal, untracked, WritableSignal } from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

export function linkedSignal<D>(fn: () => D): WritableSignal<D>;
export function linkedSignal<S, D>(spec: {
  source: () => S;
  computation: (source: S, previous: { source: S; value: D } | undefined) => D;
}): WritableSignal<D>;
export function linkedSignal(fnOrSpec: any): WritableSignal<any> {
  const source = typeof fnOrSpec === 'function' ? fnOrSpec : fnOrSpec.source;
  const computation = typeof fnOrSpec === 'function' ? (v: any) => v : fnOrSpec.computation;
  let previous: { source: any; value: any } | undefined = undefined;
  const c = computed(() => {
    const nextSource = source();
    const nextValue = computation(nextSource, previous);
    previous = { source: nextSource, value: nextValue };
    return signal(nextValue);
  });
  const s = (() => c()()) as WritableSignal<any>;
  s.set = (value: any) => {
    untracked(c).set(value);
    previous!.value = value;
  };
  s.update = (fn: (value: any) => any) => untracked(c).update(fn);
  s.asReadonly = () => s;
  s[SIGNAL] = c[SIGNAL];
  return s;
}

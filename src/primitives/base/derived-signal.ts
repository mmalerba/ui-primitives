import { computed, signal, untracked, WritableSignal } from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

export function derivedSignal<T>(fn: () => T): WritableSignal<T> {
  const c = computed(() => signal(fn()));
  const s = (() => c()()) as WritableSignal<T>;
  s.set = (value: T) => untracked(c).set(value);
  s.update = (fn: (value: T) => T) => untracked(c).update(fn);
  s.asReadonly = () => s;
  s[SIGNAL] = c[SIGNAL];
  return s;
}

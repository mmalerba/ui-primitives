import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { linkedSignal } from './linked-signal';

export function writableDefault<T>(value: Signal<T> | undefined, fallback: T): WritableSignal<T> {
  return value ? linkedSignal(value) : signal(fallback);
}

export function readonlyDefault<T>(value: Signal<T> | undefined, fallback: T): Signal<T> {
  return value ?? computed(() => fallback);
}

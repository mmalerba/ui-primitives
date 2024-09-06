import { computed, Signal, signal, untracked, WritableSignal } from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

export function hasFocus(element: HTMLElement) {
  return typeof document !== 'undefined' && element.contains(document.activeElement);
}

export function derivedSignal<T>(fn: () => T): WritableSignal<T> {
  const c = computed(() => signal(fn()));
  const s = (() => c()()) as WritableSignal<T>;
  s.set = (value: T) => untracked(c).set(value);
  s.update = (fn: (value: T) => T) => untracked(c).update(fn);
  s.asReadonly = () => s;
  s[SIGNAL] = c[SIGNAL];
  return s;
}

export function merge<T>(a: Signal<T>, b: Signal<T>): Signal<T> {
  const ca = computed(() => {
    const ia = a();
    const cb = computed(() => signal(b()));
    untracked(() => cb().set(ia));
    return cb;
  });
  const s = (() => ca()()()) as Signal<T>;
  s[SIGNAL] = ca[SIGNAL];
  return s;
}

const UI_STATE = Symbol();

export type UiState<T extends object = object> = T & { [UI_STATE]: T | undefined };

export function createUiState<T extends { [k: string]: any }>(state: T): UiState<T> {
  const stateSignal = signal(state);
  return new Proxy(
    { ...state, [UI_STATE]: undefined },
    {
      get(_, property) {
        return Reflect.get(stateSignal(), property);
      },
      set(_, property, value) {
        untracked(() => stateSignal.update((old) => ({ ...old, [property]: value })));
        return true;
      },
    }
  );
}

export class Behavior<T extends UiState<object>> {
  protected readonly listeners: VoidFunction[] = [];

  constructor(protected readonly uiState: T) {}

  remove() {
    for (const unlisten of this.listeners) {
      unlisten();
    }
  }
}

export interface BehaviorEventTarget<T extends Event> {
  listen(listener: (event: T) => void): () => void;
}

export class EventDispatcher<T extends Event> implements BehaviorEventTarget<T> {
  private listeners = new Set<(event: T) => void>();

  listen(listener: (event: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(event: T) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

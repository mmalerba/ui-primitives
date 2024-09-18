import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { linkedSignal } from './linked-signal';

export type PatchableSignal<T> = Signal<T> & {
  patch: (
    computation: (parent: T) => T,
    opts?: { connected: Signal<boolean> }
  ) => WritableSignal<T>;
};

export function patchableSignal<T>(cmp: () => T): PatchableSignal<T> {
  const tail = signal(computed(cmp));
  const result = computed(() => tail()()) as unknown as PatchableSignal<T>;
  result.patch = (computation: (parent: T) => T, opts?: { connected: Signal<boolean> }) => {
    const parent = tail();
    const patchResult = linkedSignal({
      source: () => [opts?.connected() ?? true, parent()] as const,
      computation: (
        [connected, parent],
        previous?: { source: readonly [boolean, T]; value: T }
      ) => {
        return connected ? computation(parent) : previous?.source[0] ? previous.value : parent;
      },
    });
    tail.set(patchResult);
    return patchResult;
  };
  return result as any;
}

import { computed, Signal, WritableSignal } from '@angular/core';
import { DeepMerge } from './deep-merge';

export type Unwrap<T> = T extends Signal<infer U> ? U : T;

export type StateGraph = { [key: string]: Signal<unknown> };

export type StateGraphTransform<G extends StateGraph> = {
  [N in keyof G]?: (g: Omit<G, N>, x: Unwrap<G[N]>) => Unwrap<G[N]>;
};

export type ReadonlySignals<G> = {
  [N in keyof G]: Signal<Unwrap<G[N]>>;
};

export type MutableSignals<G> = {
  [N in keyof G]: WritableSignal<Unwrap<G[N]>>;
};

export type ComposedState<TS> = TS extends [StateGraphTransform<infer G>, ...infer R]
  ? DeepMerge<G, ComposedState<R>>
  : unknown;

export function applyTransform<G extends StateGraph>(
  g: G,
  t: StateGraphTransform<G>
): ReadonlySignals<G> {
  const result = { ...g };
  for (const node in t) {
    result[node] = computed(() =>
      t[node]!(result, g[node]() as Unwrap<G[typeof node]>)
    ) as G[typeof node];
  }
  return result as ReadonlySignals<G>;
}

export function composeTransforms<TS extends StateGraphTransform<any>[]>(
  ...ts: TS
): StateGraphTransform<ComposedState<TS>> {
  const result: any = {};
  for (const t of ts) {
    for (const node in t) {
      const prevT = result[node];
      result[node] = prevT
        ? (g: ComposedState<TS>, v: unknown) => t[node]!(g, prevT(g, v))
        : t[node];
    }
  }
  return result;
}

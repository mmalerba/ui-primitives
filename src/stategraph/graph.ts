import { computed, Signal } from '@angular/core';

export type Unwrap<T> = T extends Signal<infer U> ? U : T;

export type StateGraph = { [key: string]: Signal<unknown> };

export type StateGraphTransform<G extends StateGraph> = {
  [N in keyof G]?: (g: Omit<G, N>, x: Unwrap<G[N]>) => Unwrap<G[N]>;
};

export type ReadonlyGraph<G extends StateGraph> = {
  [N in keyof G]: Signal<Unwrap<G[N]>>;
};

export type DeepMergeSignals<T1, T2> = T1 extends Signal<infer U1>
  ? T2 extends Signal<infer U2>
    ? Signal<DeepMergeSignals<U1, U2>>
    : DeepMergeSignalsArrays<T1, T2>
  : DeepMergeSignalsArrays<T1, T2>;

export type DeepMergeSignalsArrays<T1, T2> = T1 extends Array<infer U1>
  ? T2 extends Array<infer U2>
    ? Array<DeepMergeSignals<U1, U2>>
    : DeepMergeSignalsObjects<T1, T2>
  : DeepMergeSignalsObjects<T1, T2>;

export type DeepMergeSignalsObjects<T1, T2> = T1 extends object
  ? T2 extends object
    ? { [K in keyof T1 & keyof T2]: DeepMergeSignals<T1[K], T2[K]> } & Omit<T1, keyof T2> &
        Omit<T2, keyof T1>
    : T1 & T2
  : T1 & T2;

export type ComposedState<TS> = TS extends [StateGraphTransform<infer G>, ...infer R]
  ? DeepMergeSignals<G, ComposedState<R>>
  : unknown;

export function applyTransform<G extends StateGraph>(
  g: G,
  t: StateGraphTransform<G>
): ReadonlyGraph<G> {
  const result = { ...g };
  for (const node in t) {
    result[node] = computed(() =>
      t[node]!(result, g[node]() as Unwrap<G[typeof node]>)
    ) as G[typeof node];
  }
  return result as ReadonlyGraph<G>;
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

import { computed, isSignal, Signal, WritableSignal } from '@angular/core';
import { linkedSignal } from './linked-signal';

export type DeepMerge<T1, T2> = DeepMergeWritableSignal<T1, T2>;

export type DeepMergeWritableSignal<T1, T2> = T1 extends WritableSignal<infer U1>
  ? T2 extends WritableSignal<infer U2>
    ? WritableSignal<DeepMerge<U1, U2>>
    : DeepMergeSignal<T1, T2>
  : DeepMergeSignal<T1, T2>;

export type DeepMergeSignal<T1, T2> = T1 extends Signal<infer U1>
  ? T2 extends Signal<infer U2>
    ? Signal<DeepMerge<U1, U2>>
    : DeepMergeArray<T1, T2>
  : DeepMergeArray<T1, T2>;

export type DeepMergeArray<T1, T2> = T1 extends Array<infer U1>
  ? T2 extends Array<infer U2>
    ? Array<DeepMerge<U1, U2>>
    : DeepMergeObject<T1, T2>
  : DeepMergeObject<T1, T2>;

export type DeepMergeObject<T1, T2> = T1 extends SimpleObject
  ? T2 extends SimpleObject
    ? { [K in keyof T1 & keyof T2]: DeepMerge<T1[K], T2[K]> } & Omit<T1, keyof T2> &
        Omit<T2, keyof T1>
    : T1 & T2
  : T1 & T2;

export interface SimpleObject {
  [key: string | number | symbol]: {} | null | undefined;
}

export function deepMerge<T1, T2>(a: T1, b: T2): DeepMerge<T1, T2> {
  if (isSignal(a) && isSignal(b)) {
    const result = computed(() => deepMerge(a(), b())) as any;
    return (a as unknown as WritableSignal<unknown>).set ||
      (b as unknown as WritableSignal<unknown>).set
      ? linkedSignal(result)
      : result;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const result = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i >= a.length) {
        result.push(b[i]);
      } else if (i >= b.length) {
        result.push(a[i]);
      } else {
        result.push(deepMerge(a[i], b[i]));
      }
    }
    return result as any;
  }
  if (isSimpleObject(a) && isSimpleObject(b)) {
    const result = {} as any;
    for (const key of Object.keys({ ...a, ...b })) {
      if (!a.hasOwnProperty(key)) {
        result[key] = b[key as keyof typeof b];
      } else if (!b.hasOwnProperty(key)) {
        result[key] = a[key as keyof typeof a];
      } else {
        result[key] = deepMerge(a[key as keyof typeof a], b[key as keyof typeof b]);
      }
    }
    return result;
  }
  if ((a as unknown) === (b as unknown)) {
    return a as any;
  }
  throw Error(`Failed to merge objects, found conflicting values: ${a} and ${b}`);
}

function isSimpleObject(value: unknown): value is object {
  return (
    value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
  );
}

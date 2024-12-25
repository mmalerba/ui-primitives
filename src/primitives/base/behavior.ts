import { Signal } from '@angular/core';

export type State<
  I extends Record<PropertyKey, any> = Record<PropertyKey, any>,
  O extends Record<PropertyKey, any> = I,
> = {
  [K in Exclude<keyof I, keyof O>]: I[K];
} & {
  [K in keyof O]: O[K];
};

export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;

export type StateComputations<A extends Record<string, any>, I extends State, O extends State> = {
  [K in keyof I]?: I[K] extends Signal<any>
    ? (args: A & { inputValue: UnwrapSignal<I[K]> }) => UnwrapSignal<I[K]>
    : never;
} & {
  [K in Exclude<keyof O, keyof I>]?: O[K] extends Signal<any>
    ? (args: A) => UnwrapSignal<O[K]>
    : never;
};

export interface Behavior<PI extends State, CI extends State, PO extends State, CO extends State> {
  computations?: StateComputations<
    { self: State<PI, PO>; items: Signal<readonly State<CI, CO>[]> },
    PI,
    PO
  >;
  itemComputations?: StateComputations<
    { self: State<CI, CO>; parent: State<PI, PO>; index: Signal<number> },
    CI,
    CO
  >;
}

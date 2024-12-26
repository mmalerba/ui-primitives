import { Signal, WritableSignal } from '@angular/core';

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
} & {
  [K in keyof O]: any;
};

export type PickWritable<T extends State> = {
  [K in keyof T as T[K] extends WritableSignal<any> ? K : never]: T[K];
};

export type MakeWritableBlock<PO extends State, CO extends State> = ({} extends PickWritable<PO>
  ? { parent?: undefined }
  : {
      parent: { [K in keyof PickWritable<PO>]: true } & {
        [K in keyof Omit<PO, keyof PickWritable<PO>>]?: undefined;
      };
    }) &
  ({} extends PickWritable<CO>
    ? { item?: undefined }
    : {
        item: { [K in keyof PickWritable<CO>]: true } & {
          [K in keyof Omit<CO, keyof PickWritable<CO>>]?: undefined;
        };
      });

export type Behavior<
  PI extends State,
  CI extends State,
  PO extends State,
  CO extends State,
> = ({} extends PO
  ? { computations?: undefined }
  : {
      computations: StateComputations<
        { self: State<PI, PO>; items: Signal<readonly State<CI, CO>[]> },
        PI,
        PO
      >;
    }) &
  ({} extends CO
    ? { itemComputations?: undefined }
    : {
        itemComputations: StateComputations<
          { self: State<CI, CO>; parent: State<PI, PO>; index: Signal<number> },
          CI,
          CO
        >;
      }) &
  ({} extends PickWritable<PO & CO>
    ? { makeWritable?: undefined }
    : { makeWritable: MakeWritableBlock<PO, CO> });

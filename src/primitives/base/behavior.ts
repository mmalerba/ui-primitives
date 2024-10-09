import { DeepMerge } from './deep-merge';
import { BehaviorEventHandlers } from './event';
import { MutableSignals, StateGraph, StateGraphTransform } from './graph';

export type IfEquivalent<T1, T2, E, U> = T1 extends T2 ? (T2 extends T1 ? E : U) : U;

export type Behavior<
  I extends StateGraph = never,
  M extends MutableSignals<StateGraph> = never,
  S extends StateGraph = never,
  E extends keyof GlobalEventHandlersEventMap = never,
  O extends StateGraph = S
> = {
  createState: (inputs: I) => { state: S; model: M };
  transform?: StateGraphTransform<S>;
} & ([E] extends [never]
  ? { events?: BehaviorEventHandlers<M, S, E> }
  : { events: BehaviorEventHandlers<M, S, E> }) &
  IfEquivalent<S, O, { output?: (state: S) => O }, { output: (state: S) => O }>;

export type ComposedBehaviorTypeParams<T extends [...Behavior<any, any, any, never, any>[]]> =
  T extends [Behavior<infer I, infer M, infer S, infer E, infer O>, ...infer R]
    ? R extends [...Behavior<any, any, any, never, any>[]]
      ? [
          DeepMerge<I, ComposedBehaviorTypeParams<R>[0]>,
          DeepMerge<M, ComposedBehaviorTypeParams<R>[1]>,
          DeepMerge<S, ComposedBehaviorTypeParams<R>[2]>,
          E | ComposedBehaviorTypeParams<R>[3],
          DeepMerge<O, ComposedBehaviorTypeParams<R>[4]>
        ]
      : [I, M, S, E, O]
    : [unknown, unknown, unknown, never, unknown];

export type ComposedBehavior<T extends [...Behavior<any, any, any, never, any>[]]> =
  ComposedBehaviorTypeParams<T> extends [
    infer I extends StateGraph,
    infer M extends MutableSignals<StateGraph>,
    infer S extends StateGraph,
    infer E extends keyof GlobalEventHandlersEventMap,
    infer O extends StateGraph
  ]
    ? Behavior<I, M, S, E, O>
    : never;

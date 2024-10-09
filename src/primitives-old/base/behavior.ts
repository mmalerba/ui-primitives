import { computed, isSignal, Signal, untracked, WritableSignal } from '@angular/core';
import { linkedSignal } from '../../primitives/base/linked-signal';
import { EventDispatcher } from './event-dispatcher';

/**
 * This file defines a `StateMachine` that operates on a state object. A state object is a simple
 * object containing signal properties representing different pieces of dynamic state on the object.
 * The state object may also contain non-signal properties representing static state that does not
 * change.
 */

/**
 * Defines a set of state transitions that map the state object's previous state to its next state.
 * This is represented as an object that maps each signal property on `S` to a function which maps
 * the previous value for that state property to the next value.
 *
 * @template S The state object type.
 * @template D The keys of the state object type which the state machine provides transitions for.
 */
export type IncrementalDerivations<S, D extends keyof S> = {
  [P in keyof Pick<S, D>]: S[P] extends Signal<infer V> ? (state: S, value: V) => V : never;
};

/**
 * Defines a set of event handlers for a state machine. This is represented as an object that maps
 * each event type to a handler function that takes the following arguments:
 *  1. An object allowing mutable access to a the subset of properties on `S` contained in `M`
 *  2. The state object that the state machine is operating on.
 *  3. The event object corresponding to the event type.
 *
 * @template S The state object type.
 * @template M The keys of the state object type which the handlers have mutable access to.
 * @template E The keys for the event types handled by the handlers.
 */
export type BehaviorEventHandlers<S, E extends keyof GlobalEventHandlersEventMap> = {
  [P in E]: (state: S, event: GlobalEventHandlersEventMap[P]) => void;
};

/**
 * Defines the event dispatchers required by a state machine.
 *
 * @template B The state machine type.
 */
export type BehaviorEventDispatchers<B extends Behavior<any, any, any>> = B extends Behavior<
  any,
  any,
  infer E
>
  ? { [P in E]: EventDispatcher<GlobalEventHandlersEventMap[P]> }
  : never;

/**
 * Defines a state machine that operates on the state object `S`. The state machine consists of a
 * set of state transtions and a set of event handlers that mutate the state.
 *
 * @template S The state object type.
 * @template D The keys of the state object type which the state machine has transitions for.
 * @template E The keys for the event types handled by the state machine.
 */
export interface Behavior<
  S extends object = object,
  D extends keyof S = any,
  E extends keyof GlobalEventHandlersEventMap = any
> {
  derivations: IncrementalDerivations<S, D>;
  events: BehaviorEventHandlers<S, E>;
}

/**
 * Defines a combined state object type for a set of composed state machines.
 *
 * @template T A tuple of the state machines being composed.
 */
export type ComposedState<T extends [...Behavior[]]> = T extends [Behavior<infer S>, ...infer R]
  ? R extends [...Behavior[]]
    ? S | ComposedState<R>
    : S
  : never;

/**
 * Defines combined state transitions properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedDerivationProperties<T extends [...Behavior[]]> = T extends [
  Behavior<any, infer P>,
  ...infer R
]
  ? R extends [...Behavior[]]
    ? P | ComposedDerivationProperties<R>
    : P
  : never;

/**
 * Defines combined state event properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedEventProperties<T extends [...Behavior[]]> = T extends [
  Behavior<any, any, infer P>,
  ...infer R
]
  ? R extends [...Behavior[]]
    ? P | ComposedEventProperties<R>
    : P
  : never;

function isWritableSignal(x: unknown): x is WritableSignal<unknown> {
  return isSignal(x) && (x as WritableSignal<unknown>).set !== undefined;
}

/**
 * Composes a set of state machines into a single state machine that operates over the combined
 * state object of all of them.
 *
 * @template T A tuple of the state machine types being composed.
 * @param behaviors The state machines to compose.
 * @returns The composed state machine.
 */
export function compose<T extends [...Behavior<any>[]]>(
  ...behaviors: T
): Behavior<ComposedState<T>, ComposedDerivationProperties<T>, ComposedEventProperties<T>> {
  type Derivations = Behavior<ComposedState<T>, ComposedDerivationProperties<T>>['derivations'];
  type DerivationFn = Derivations[keyof Derivations];
  const result = {
    derivations: {},
    events: {},
  } as Behavior<ComposedState<T>, ComposedDerivationProperties<T>, ComposedEventProperties<T>>;
  for (const behavior of behaviors) {
    for (const [key, derivationFn] of Object.entries(behavior?.derivations ?? {})) {
      const stateProperty = key as ComposedDerivationProperties<T>;
      const prevDerivationFn = result.derivations[stateProperty];
      result.derivations[stateProperty] = ((s: ComposedState<T>, v: unknown) =>
        derivationFn(s, prevDerivationFn ? prevDerivationFn(s, v) : v)) as DerivationFn;
    }
    for (const [key, handler] of Object.entries(behavior?.events ?? {})) {
      const eventType = key as ComposedEventProperties<T>;
      const prevHandler = result.events[eventType];
      (result.events[eventType] as unknown) = (...args: [ComposedState<T>, Event]) => {
        if (prevHandler) {
          prevHandler(...args);
        }
        handler(...args);
      };
    }
  }
  return result;
}

/**
 * Takes a state object, a state machine, and a set of event dispatchers for the machine, and
 * returns a new state object that is the result of applying the state machine to the input state
 * object.
 *
 * @param state The state to apply the machine to
 * @param behavior The state machine to apply
 * @param events The event dispatchers for the machine
 * @returns The state with the machine applied
 */
export function applyBehavior<S extends object, B extends Behavior<S>>(
  state: S,
  behavior: B,
  events: BehaviorEventDispatchers<B>
): S {
  type StatePropertyValue = S[keyof S];
  const result = { ...state };
  for (const [key, transform] of Object.entries(behavior.derivations)) {
    const stateProperty = key as keyof S;
    const initial = result[stateProperty];
    if (isSignal(initial)) {
      if (isWritableSignal(initial)) {
        result[stateProperty] = linkedSignal(() =>
          transform(result, initial())
        ) as StatePropertyValue;
      } else {
        result[stateProperty] = computed(() => transform(result, initial())) as StatePropertyValue;
      }
    } else {
      throw Error(`Cannot update non-signal state property ${stateProperty.toString()}`);
    }
  }
  for (const [eventType, handler] of Object.entries(behavior.events) as [
    keyof BehaviorEventDispatchers<B>,
    (state: S, event: Event) => void
  ][]) {
    const dispatcher = events[eventType];
    dispatcher.listen((event) => handler(result, event));
  }
  return result;
}

/**
 * Takes a state object, a signal for a state machine, and a set of event dispatchers for the
 * machine, and returns a signal of state objects that is the result of applying the state machine
 * to the input state object.
 *
 * @param state The state to apply the machine to
 * @param behavior A signal of the state machine to apply
 * @param events The event dispatchers for the machine
 * @returns A signal of the state with the machine applied
 */
export function applyDynamicBehavior<S extends object, B extends Behavior<S>>(
  state: S,
  behavior: Signal<B>,
  events: BehaviorEventDispatchers<B>
): Signal<S> {
  let prev: { state: S; behavior: Behavior<S> } | undefined;
  return computed(() => {
    const newBehavior = behavior();
    return untracked(() => {
      const initial = { ...state };
      if (prev) {
        for (const key of Object.keys(prev.behavior.derivations)) {
          const stateProperty = key as keyof S;
          const value = initial[stateProperty];
          if (isWritableSignal(value)) {
            const prevValueSignal = prev.state[stateProperty] as Signal<unknown>;
            value.set(prevValueSignal());
          }
        }
      }
      Object.values(events).forEach((dispatcher) => dispatcher.reset());
      const result = applyBehavior(initial, newBehavior, events);
      prev = { behavior: newBehavior, state: result };
      return result;
    });
  });
}

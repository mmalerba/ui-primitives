import { computed, Signal, untracked, WritableSignal } from '@angular/core';
import { linkedSignal } from './linked-signal';

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
 * @template T The keys of the state object type which the state machine provides transitions for.
 */
export type StateTransitions<S, T extends keyof S> = {
  [P in keyof Pick<S, T>]: S[P] extends Signal<infer V> ? (state: S, value: V) => V : never;
};

/**
 * Defines a mutable version of a state object, mapping each signal property on `S` to a writable
 * signal property of the same type.
 *
 * @template S The state object type.
 */
export type MutableState<S> = {
  [P in keyof S]: S[P] extends Signal<infer T> ? WritableSignal<T> : never;
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
export type StateMachineEventHandlers<
  S,
  M extends keyof S,
  E extends keyof GlobalEventHandlersEventMap
> = {
  [P in E]: (
    mutable: MutableState<Pick<S, M>>,
    state: S,
    event: GlobalEventHandlersEventMap[P]
  ) => void;
};

/**
 * Defines a state machine that operates on the state object `S`. The state machine consists of a
 * set of state transtions and a set of event handlers that mutate the state.
 *
 * @template S The state object type.
 * @template T The keys of the state object type which the state machine has transitions for.
 * @template E The keys for the event types handled by the state machine.
 */
export interface StateMachine<
  S,
  T extends keyof S = any,
  E extends keyof GlobalEventHandlersEventMap = never
> {
  transitions: StateTransitions<S, T>;
  events: E extends keyof GlobalEventHandlersEventMap ? StateMachineEventHandlers<S, T, E> : never;
}

/**
 * Defines a combined state object type for a set of composed state machines.
 *
 * @template T A tuple of the state machines being composed.
 */
export type ComposedState<T extends [...StateMachine<any, any, any>[]]> = T extends [
  StateMachine<infer S, any, any>,
  ...infer R
]
  ? R extends [...StateMachine<any, any, any>[]]
    ? S | ComposedState<R>
    : never
  : never;

/**
 * Defines combined state transitions properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedTransitionProperties<T extends [...StateMachine<any, any, any>[]]> = T extends [
  StateMachine<any, infer P, any>,
  ...infer R
]
  ? R extends [...StateMachine<any, any, any>[]]
    ? P | ComposedTransitionProperties<R>
    : never
  : never;

/**
 * Defines combined state event properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedEventProperties<T extends [...StateMachine<any, any, any>[]]> = T extends [
  StateMachine<any, any, infer P>,
  ...infer R
]
  ? R extends [...StateMachine<any, any, any>[]]
    ? P | ComposedEventProperties<R>
    : never
  : never;

/**
 * Composes a set of state machines into a single state machine that operates over the combined
 * state object of all of them.
 *
 * @template T A tuple of the state machine types being composed.
 * @param stateMachines The state machines to compose.
 * @returns The composed state machine.
 */
export function compose<T extends [...StateMachine<any, any, any>[]]>(
  ...stateMachines: T
): StateMachine<ComposedState<T>, ComposedTransitionProperties<T>, ComposedEventProperties<T>> {
  type Transitions = StateMachine<ComposedState<T>, ComposedTransitionProperties<T>>['transitions'];
  type TransitionFn = Transitions[keyof Transitions];
  const result = {
    transitions: {},
    events: {},
  } as StateMachine<ComposedState<T>, ComposedTransitionProperties<T>, ComposedEventProperties<T>>;
  for (const machine of stateMachines) {
    for (const [key, transform] of Object.entries(machine?.transitions ?? {})) {
      const stateProperty = key as ComposedTransitionProperties<T>;
      const prevTransform = result.transitions[stateProperty];
      result.transitions[stateProperty] = ((s: ComposedState<T>, v: unknown) =>
        transform(s, prevTransform ? prevTransform(s, v) : v)) as TransitionFn;
    }
    for (const [key, handler] of Object.entries(machine?.events ?? {})) {
      const eventType = key as ComposedEventProperties<T>;
      const prevHandler = result.events[eventType];
      (result.events[eventType] as unknown) = (...args: [any, any, any]) => {
        if (prevHandler) {
          prevHandler(...args);
        }
        handler(...args);
      };
    }
  }
  return result;
}

export function applyStateMachine<S>(state: S, machine: StateMachine<S>): S {
  type StateProperty = S[keyof S];
  const result = { ...state };
  for (const [key, transform] of Object.entries(machine.transitions)) {
    const stateProperty = key as keyof S;
    const initial = result[stateProperty] as Signal<unknown>;
    result[stateProperty] = computed(() => transform(result, initial())) as StateProperty;
  }
  return result;
}

export function applyDynamicStateMachine<S>(
  state: S,
  stateMachine: Signal<StateMachine<S>>
): Signal<S> {
  type StateProperty = S[keyof S];
  let prev: { state: S; machine: StateMachine<S> } | undefined;
  return computed(() => {
    const machine = stateMachine();
    return untracked(() => {
      const initial = { ...state };
      if (prev) {
        for (const key of Object.keys(prev.machine.transitions)) {
          const stateProperty = key as keyof S;
          const valueSignal = initial[stateProperty] as Signal<unknown>;
          const prevValueSignal = prev.state[stateProperty] as Signal<unknown>;
          const linkedValue = linkedSignal(() => valueSignal());
          linkedValue.set(prevValueSignal());
          initial[stateProperty] = linkedValue as StateProperty;
        }
      }
      const result = applyStateMachine(initial, machine);
      prev = { machine, state: result };
      return result;
    });
  });
}

// Notes (TODO):
// - Make each of the above props a derived signal instead
// - Pass the derived signal to the handlers for each incremental state

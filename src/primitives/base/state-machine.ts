import { computed, Signal, untracked, WritableSignal } from '@angular/core';

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
 */
export type StateTransitions<S> = {
  [P in keyof S]: S[P] extends Signal<infer T> ? (value: T) => T : never;
};

/**
 * Defines a mutable version of a state object, mapping each signal property on `S` to a writable
 * signal property of the same type.
 *
 * @template S The state object type.
 */
export type Mutable<S> = {
  [P in keyof S]: S[P] extends Signal<infer T> ? WritableSignal<T> : never;
};

/**
 * Defines a set of event handlers for a state machine. This is represented as an object that maps
 * each event type to a handler function that takes the following arguments:
 *  1. An object allowing mutable access to a the subset of properties on `S` contained in `M`
 *  2. The event object corresponding to the event type.
 *  3. The state object that the state machine is operating on.
 *
 * @template S The state object type.
 * @template M The keys of the state object type which the handler has mutable access to.
 */
export type StateMachineEventHandlers<S, M extends keyof S> = {
  [P in keyof GlobalEventHandlersEventMap]?: (
    mutable: Mutable<Pick<S, M>>,
    event: GlobalEventHandlersEventMap[P],
    state: S
  ) => void;
};

/**
 * Defines a state machine that operates on the state object `S`. The state machine consists of a
 * set of state transtions and a set of event handlers that mutate the state.
 *
 * @template S The state object type.
 * @template T The keys of the state object type which the state machine provides transitions for.
 */
export interface StateMachine<S, T extends keyof S> {
  transitions: StateTransitions<Pick<S, T>>;
  eventHandlers?: StateMachineEventHandlers<S, T>;
}

/**
 * The combined state object type for a set of composed state machines.
 *
 * @template T A tuple of the state machines being composed.
 */
export type ComposedState<T extends [...StateMachine<any, any>[]]> = T extends [
  StateMachine<infer S, any>,
  ...infer R
]
  ? R extends [...StateMachine<any, any>[]]
    ? S | ComposedState<R>
    : []
  : never;

/**
 * The combined state transitions properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedTransitionProperties<T extends [...StateMachine<any, any>[]]> = T extends [
  StateMachine<any, infer P>,
  ...infer R
]
  ? R extends [...StateMachine<any, any>[]]
    ? P | ComposedTransitionProperties<R>
    : []
  : never;

/**
 * Composes a set of state machines into a single state machine that operates over the combined
 * state object of all of them.
 *
 * @template T A tuple of the state machine types being composed.
 * @param stateMachines The state machines to compose.
 * @returns
 */
export function compose<T extends [...StateMachine<any, any>[]]>(
  ...stateMachines: T
): StateMachine<ComposedState<T>, ComposedTransitionProperties<T>> {
  const result: StateMachine<ComposedState<T>, ComposedTransitionProperties<T>> = {
    transitions: {} as any,
    eventHandlers: {},
  };
  for (const machine of stateMachines) {
    for (const [stateProperty, transform] of Object.entries(machine?.transitions ?? {})) {
      const key = stateProperty as ComposedTransitionProperties<T>;
      const prevTransform = result.transitions[key];
      result.transitions[key] = ((v: unknown) =>
        transform(prevTransform ? prevTransform(v) : v)) as any;
    }
  }
  return result;
}

// TODO: clean this function up.
/**
 * Connects the initial state object to a set of state machines and returns a signal of the state
 * with the machines applied to it.
 *
 * Because the given machines is a signal, it may change over time. The returned state signal will
 * be kept in sync with the current machines.
 *
 * @template S The state object type.
 * @param initial The initial state object.
 * @param machines A signal of state machines to attach to the initial state.
 * @returns A signal of the state object with the state machines applied.
 */
export function connectStateMachines<S>(
  initial: S,
  machines: Signal<StateMachine<S, any>[]>
): Signal<S> {
  let prev: S = initial;
  return computed(() => {
    const machine = compose(...(machines() as [StateMachine<S, any>]));
    const result = { ...prev };
    for (const [state, transform] of Object.entries(machine.transitions)) {
      const stateKey = state as keyof S;
      const initial = result[stateKey] as any;
      result[stateKey] = computed(() => transform(untracked(initial))) as any;
    }
    return (prev = result);
  });
}

// Notes (TODO):
// - Make each of the above props a derived signal instead
// - Pass the derived signal to the handlers for each incremental state
// - Save the values from the previous computed into the initial value of the new derived signal
// - Maybe we need state machine factories (to configure options, etc, before passing in state)
//   - Or each transition function takes the state as input?

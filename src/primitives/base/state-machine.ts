import { computed, Signal, untracked, WritableSignal } from '@angular/core';
import { EventDispatcher } from './event-dispatcher';
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
 * Defines the event dispatchers required by a state machine.
 *
 * @template M The state machine type.
 */
export type StateMachineEventDispatchers<M extends StateMachine<any>> = M extends StateMachine<
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
 * @template T The keys of the state object type which the state machine has transitions for.
 * @template E The keys for the event types handled by the state machine.
 */
export interface StateMachine<
  S,
  T extends keyof S = any,
  E extends keyof GlobalEventHandlersEventMap = never
> {
  transitions: StateTransitions<S, T>;
  events: [E] extends [never]
    ? { [P in keyof GlobalEventHandlersEventMap]?: never }
    : StateMachineEventHandlers<S, T, E>;
}

/**
 * Defines a combined state object type for a set of composed state machines.
 *
 * @template T A tuple of the state machines being composed.
 */
export type ComposedState<T extends [...StateMachine<any>[]]> = T extends [
  StateMachine<infer S>,
  ...infer R
]
  ? R extends [...StateMachine<any>[]]
    ? S | ComposedState<R>
    : S
  : never;

/**
 * Defines combined state transitions properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedTransitionProperties<T extends [...StateMachine<any>[]]> = T extends [
  StateMachine<any, infer P, any>,
  ...infer R
]
  ? R extends [...StateMachine<any>[]]
    ? P | ComposedTransitionProperties<R>
    : P
  : never;

/**
 * Defines combined state event properties for a set of composed state machines.
 *
 * @template T A tuple of the state machine types being composed.
 */
export type ComposedEventProperties<T extends [...StateMachine<any>[]]> = T extends [
  StateMachine<any, any, infer P>,
  ...infer R
]
  ? R extends [...StateMachine<any>[]]
    ? P | ComposedEventProperties<R>
    : P
  : never;

/**
 * Composes a set of state machines into a single state machine that operates over the combined
 * state object of all of them.
 *
 * @template T A tuple of the state machine types being composed.
 * @param stateMachines The state machines to compose.
 * @returns The composed state machine.
 */
export function compose<T extends [...StateMachine<any>[]]>(
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
      const prevHandler = result.events[eventType] as Function | undefined;
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

/**
 * Takes a state object, a state machine, and a set of event dispatchers for the machine, and
 * returns a new state object that is the result of applying the state machine to the input state
 * object.
 *
 * @param state The state to apply the machine to
 * @param machine The state machine to apply
 * @param events The event dispatchers for the machine
 * @returns The state with the machine applied
 */
export function applyStateMachine<S, M extends StateMachine<S>>(
  state: S,
  machine: M,
  events: StateMachineEventDispatchers<M>
): S {
  type StatePropertyValue = S[keyof S];
  const result = { ...state };
  const mutable = {} as { [P in keyof M['transitions'] & keyof S]: S[P] };
  for (const [key, transform] of Object.entries(machine.transitions)) {
    const stateProperty = key as keyof S;
    const initial = result[stateProperty] as Signal<unknown>;
    mutable[stateProperty] = linkedSignal(() => transform(result, initial())) as StatePropertyValue;
    result[stateProperty] = mutable[stateProperty];
  }
  for (const [eventType, handler] of Object.entries(machine.events) as [
    keyof StateMachineEventDispatchers<M>,
    (mutable: unknown, state: unknown, event: Event) => void
  ][]) {
    const dispatcher = events[eventType] as EventDispatcher<Event>;
    dispatcher.listen((event) => handler(mutable, result, event));
  }
  return result;
}

/**
 * Takes a state object, a signal for a state machine, and a set of event dispatchers for the
 * machine, and returns a signal of state objects that is the result of applying the state machine
 * to the input state object.
 *
 * @param state The state to apply the machine to
 * @param machine A signal of the state machine to apply
 * @param events The event dispatchers for the machine
 * @returns A signal of the state with the machine applied
 */
export function applyDynamicStateMachine<S, M extends StateMachine<S>>(
  state: S,
  stateMachine: Signal<M>,
  events: StateMachineEventDispatchers<M>
): Signal<S> {
  type StatePropertyValue = S[keyof S];
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
          initial[stateProperty] = linkedValue as StatePropertyValue;
        }
      }
      // TODO: disconnect event dispatcher from previous machine.
      const result = applyStateMachine(initial, machine, events);
      prev = { machine, state: result };
      return result;
    });
  });
}

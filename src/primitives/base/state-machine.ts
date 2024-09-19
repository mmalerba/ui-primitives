import { computed, Signal } from '@angular/core';

export type StateTransition<T> = {
  [P in keyof T]?: T[P] extends Signal<infer S> ? (value: S) => S : never;
};

export interface StateMachine<S> {
  transitions?: StateTransition<S>;
  handlers?: {};
}

export function connectStateMachines<S>(state: S, machines: Signal<StateMachine<S>[]>): Signal<S> {
  return computed(() => {
    const transforms: { [state: string]: (v: unknown) => unknown } = {};
    for (const machine of machines()) {
      for (const [state, transform] of Object.entries(machine?.transitions ?? {})) {
        const prev = transforms[state];
        transforms[state] = (v: any) => (transform as any)(prev ? prev(v) : v);
      }
    }
    const result = { ...state };
    for (const [state, transform] of Object.entries(transforms)) {
      const stateKey = state as keyof S;
      const initial = result[stateKey] as any;
      result[stateKey] = computed(() => transform(initial())) as any;
    }
    return result;
  });
}

// Notes:
// - Make each of the above props a derived signal instead
// - Pass the derived signal to the handlers for each incremental state
// - Save the values from the previous computed into the initial value of the new derived signal
// - Maybe we need state machine factories (to configure options, etc, before passing in state)

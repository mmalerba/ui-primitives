import { signal, Signal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface ActiveDescendantItemState {
  id: Signal<string>;
  tabindex: Signal<0 | -1>;
}

export interface ActiveDescendantState<I extends ActiveDescendantItemState> {
  items: Signal<I[]>;
  active: Signal<I | undefined>;
  activeDescendantId: Signal<string | undefined>;
  tabindex: Signal<0 | -1>;
  disabled: Signal<boolean>;
}

export type ActiveDescendantTransitions = 'activeDescendantId' | 'tabindex' | 'items';

export function createActiveDescendantStateMachine<I extends ActiveDescendantItemState>(
  state: Signal<ActiveDescendantState<I>>
): StateMachine<ActiveDescendantState<I>, ActiveDescendantTransitions> {
  return {
    transitions: {
      activeDescendantId: () => state().active()?.id(),
      tabindex: () => (state().disabled() ? -1 : 0),
      items: (items) =>
        items.map((item) => ({
          ...item,
          tabindex: signal(-1),
        })),
    },
    eventHandlers: {
      focusin: ({ activeDescendantId }, event, state) => {
        // TODO
      },
    },
  };
}

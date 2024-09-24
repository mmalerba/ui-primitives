import { signal, Signal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface ActiveDescendantItemState {
  id: Signal<string>;
  tabindex: Signal<0 | -1>;
}

export interface ActiveDescendantState<
  I extends ActiveDescendantItemState = ActiveDescendantItemState
> {
  items: Signal<I[]>;
  active: Signal<I | undefined>;
  activeDescendantId: Signal<string | undefined>;
  tabindex: Signal<0 | -1>;
  disabled: Signal<boolean>;
}

export type ActiveDescendantTransitions = 'activeDescendantId' | 'tabindex' | 'items';

export const activeDescendantStateMachine: StateMachine<
  ActiveDescendantState,
  ActiveDescendantTransitions
> = {
  transitions: {
    activeDescendantId: (state) => state.active()?.id(),
    tabindex: (state) => (state.disabled() ? -1 : 0),
    items: (_, items) =>
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

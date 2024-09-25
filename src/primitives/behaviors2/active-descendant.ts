import { signal, Signal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface ActiveDescendantOptions {}

export interface ActiveDescendantItemState {
  readonly id: Signal<string>;
  readonly tabindex: Signal<0 | -1>;
}

export interface ActiveDescendantState<
  I extends ActiveDescendantItemState = ActiveDescendantItemState
> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly I[]>;
  readonly active: Signal<I | undefined>;
  readonly activeDescendantId: Signal<string | undefined>;
  readonly tabindex: Signal<0 | -1>;
  readonly disabled: Signal<boolean>;
  readonly focused: Signal<HTMLElement | undefined>;
}

export type ActiveDescendantTransitions = 'activeDescendantId' | 'tabindex' | 'items' | 'focused';

export type ActiveDescendantEvents = 'focusin';

export const DEFAULT_ACTIVE_DESCENDANT_OPTIONS: ActiveDescendantOptions = {};

export function getActiveDescendantStateMachine(
  options: ActiveDescendantOptions = DEFAULT_ACTIVE_DESCENDANT_OPTIONS
): StateMachine<ActiveDescendantState, ActiveDescendantTransitions, ActiveDescendantEvents> {
  options = { ...DEFAULT_ACTIVE_DESCENDANT_OPTIONS, ...options };
  return {
    transitions: {
      activeDescendantId: (state) => state.active()?.id(),
      tabindex: (state) => (state.disabled() ? -1 : 0),
      items: (_, items) =>
        items.map((item) => ({
          ...item,
          tabindex: signal(-1),
        })),
      focused: (_, focused) => focused,
    },
    events: {
      focusin: ({ focused }, state) => {
        if (!state.disabled()) {
          focused.set(state.element);
        }
      },
    },
  };
}

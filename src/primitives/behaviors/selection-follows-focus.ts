import { Signal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface SelectionFollowsFocusOptions {}

export interface SelectionFollowsFocusItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface SelectionFollowsFocusState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly SelectionFollowsFocusItemState<I>[]>;
  readonly selected: Signal<I | undefined>;
  readonly activated: Signal<I | undefined>;
  readonly active: Signal<I | undefined>;
  readonly disabled: Signal<boolean>;
}

export type SelectionFollowsFocusTransitions = 'selected' | 'disabled' | 'active';

export type SelectionFollowsFocusEvents = 'focusin';

export const DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS: SelectionFollowsFocusOptions = {};

export function getSelectionFollowsFocusStateMachine(
  options: SelectionFollowsFocusOptions = DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS
): StateMachine<
  SelectionFollowsFocusState,
  SelectionFollowsFocusTransitions,
  SelectionFollowsFocusEvents
> {
  options = { ...DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS, ...options };
  return {
    transitions: {
      selected: (state, selected) => state.activated() ?? selected,
      disabled: (state, disabled) => {
        const selectedItem = state.items().find((item) => item.identity === state.selected());
        return disabled || !!selectedItem?.disabled();
      },
      active: (_, active) => active,
    },
    events: {
      focusin: ({ active }, state) => {
        if (!state.disabled()) {
          active.set(state.selected());
        }
      },
    },
  };
}

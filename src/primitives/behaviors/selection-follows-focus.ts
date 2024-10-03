import { Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';

export interface SelectionFollowsFocusOptions {}

export interface SelectionFollowsFocusItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface SelectionFollowsFocusState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly SelectionFollowsFocusItemState<I>[]>;
  readonly selected: Signal<I | undefined>;
  readonly disabled: Signal<boolean>;

  readonly activated: WritableSignal<I | undefined>;
}

export type SelectionFollowsFocusTransitions = 'selected' | 'disabled';

export type SelectionFollowsFocusEvents = 'focusin';

export const DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS: SelectionFollowsFocusOptions = {};

export function getSelectionFollowsFocusBehavior(
  options: SelectionFollowsFocusOptions = DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS
): Behavior<
  SelectionFollowsFocusState,
  SelectionFollowsFocusTransitions,
  SelectionFollowsFocusEvents
> {
  options = { ...DEFAULT_SELECTION_FOLLOWS_FOCUS_OPTIONS, ...options };
  return {
    derivations: {
      selected: (state, selected) => state.activated() ?? selected,
      disabled: (state, disabled) => {
        const selectedItem = state.items().find((item) => item.identity === state.selected());
        return disabled || !!selectedItem?.disabled();
      },
    },
    events: {
      focusin: (state) => {
        const selectedItem = state.items().find((item) => item.identity === state.selected());
        if (!state.disabled() && selectedItem) {
          state.activated.set(state.selected());
        }
      },
    },
  };
}

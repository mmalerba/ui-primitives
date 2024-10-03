import { Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';

export interface SelectionOnCommitOptions {}

export interface SelectionOnCommitItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface SelectionOnCommitState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly SelectionOnCommitItemState<I>[]>;
  readonly active: Signal<I | undefined>;
  readonly disabled: Signal<boolean>;

  readonly selected: WritableSignal<I | undefined>;
}

export type SelectionOnCommitTransitions = 'disabled';

export type SelectionOnCommitEvents = 'keydown';

export const DEFAULT_SELECTION_ON_COMMIT_OPTIONS: SelectionOnCommitOptions = {};

export function getSelectionOnCommitBehavior(
  options: SelectionOnCommitOptions = DEFAULT_SELECTION_ON_COMMIT_OPTIONS
): Behavior<SelectionOnCommitState, SelectionOnCommitTransitions, SelectionOnCommitEvents> {
  options = { ...DEFAULT_SELECTION_ON_COMMIT_OPTIONS, ...options };
  return {
    derivations: {
      disabled: (state, disabled) => {
        const selectedItem = state.items().find((item) => item.identity === state.selected());
        return disabled || !!selectedItem?.disabled();
      },
    },
    events: {
      keydown: (state, event) => handleKeydown(state, event),
    },
  };
}

function handleKeydown<I>(state: SelectionOnCommitState<I>, event: KeyboardEvent) {
  if (state.disabled()) {
    return;
  }

  switch (event.key) {
    case 'Enter':
    case ' ':
      const selectedItem = state.items().find((item) => item.identity === state.selected());
      const activeItem = state.items().find((item) => item.identity === state.active());
      const canSelectActiveItem = !(
        state.disabled() ||
        selectedItem?.disabled() ||
        activeItem?.disabled()
      );

      if (canSelectActiveItem) {
        state.selected.set(state.active());
      }
      break;
  }
}

import { Signal, WritableSignal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface SelectionOnCommitOptions {}

export interface SelectionOnCommitItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface SelectionOnCommitState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly SelectionOnCommitItemState<I>[]>;
  readonly selected: Signal<I | undefined>;
  readonly active: Signal<I | undefined>;
  readonly disabled: Signal<boolean>;
}

export type SelectionOnCommitTransitions = 'selected' | 'disabled';

export type SelectionOnCommitEvents = 'keydown';

export const DEFAULT_SELECTION_ON_COMMIT_OPTIONS: SelectionOnCommitOptions = {};

export function getSelectionOnCommitStateMachine(
  options: SelectionOnCommitOptions = DEFAULT_SELECTION_ON_COMMIT_OPTIONS
): StateMachine<SelectionOnCommitState, SelectionOnCommitTransitions, SelectionOnCommitEvents> {
  options = { ...DEFAULT_SELECTION_ON_COMMIT_OPTIONS, ...options };
  return {
    transitions: {
      selected: (_, selected) => selected,
      disabled: (state, disabled) => {
        const selectedItem = state.items().find((item) => item.identity === state.selected());
        return disabled || !!selectedItem?.disabled();
      },
    },
    events: {
      keydown: ({ selected }, state, event) => handleKeydown(selected, state, event),
    },
  };
}

function handleKeydown<I>(
  selected: WritableSignal<I | undefined>,
  state: SelectionOnCommitState<I>,
  event: KeyboardEvent
) {
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
        selected.set(state.active());
      }
      break;
  }
}

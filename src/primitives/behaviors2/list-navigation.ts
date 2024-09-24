import { Signal, WritableSignal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface ListNavigationItemState {
  readonly disabled: Signal<boolean>;
}

export interface ListNavigationState<I extends ListNavigationItemState = ListNavigationItemState> {
  readonly activated: Signal<I | undefined>;
  readonly active: Signal<I | undefined>;
  readonly items: Signal<readonly I[]>;
  readonly orientation: Signal<'vertical' | 'horizontal'>;
  readonly direction: Signal<'ltr' | 'rtl'>;
  readonly disabled: Signal<boolean>;
}

export const listNavigationStateMachine: StateMachine<ListNavigationState, 'activated' | 'active'> =
  {
    transitions: {
      activated: (_, activated) => activated,
      active: (state, active) => {
        const item = state.items().find((item) => item === (state.activated() ?? active));
        return item?.disabled() ? undefined : item;
      },
    },
    events: {
      keydown: handleKeydown,
    },
  };

function handleKeydown(
  { activated }: { activated: WritableSignal<unknown> },
  state: ListNavigationState,
  event: KeyboardEvent
) {
  switch (event.key) {
    case 'ArrowDown':
      if (state.orientation() === 'vertical') {
        activateNextItem(activated, state);
        event.preventDefault();
      }
      break;
    case 'ArrowUp':
      if (state.orientation() === 'vertical') {
        activatePreviousItem(activated, state);
        event.preventDefault();
      }
      break;
    case 'ArrowRight':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activateNextItem(activated, state);
        } else {
          activatePreviousItem(activated, state);
        }
        event.preventDefault();
      }
      break;
    case 'ArrowLeft':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activatePreviousItem(activated, state);
        } else {
          activateNextItem(activated, state);
        }
        event.preventDefault();
      }
      break;
  }
}

function getActiveIndex(state: ListNavigationState) {
  const active = state.active();
  return active ? state.items().indexOf(active) : -1;
}

function activateNextItem(activated: WritableSignal<unknown>, state: ListNavigationState) {
  const currentIndex = getActiveIndex(state);
  let nextIndex = currentIndex;
  do {
    nextIndex = clampIndex(nextIndex + 1, state);
  } while (
    !canActivate(nextIndex, state) &&
    nextIndex !== currentIndex &&
    nextIndex < state.items().length - 1
  );
  if (canActivate(nextIndex, state)) {
    activated.set(state.items()[nextIndex]);
  }
}

function activatePreviousItem(activated: WritableSignal<unknown>, state: ListNavigationState) {
  const currentIndex = getActiveIndex(state);
  let nextIndex = currentIndex;
  do {
    nextIndex = clampIndex(nextIndex - 1, state);
  } while (!canActivate(nextIndex, state) && nextIndex !== currentIndex && nextIndex > 0);
  if (canActivate(nextIndex, state)) {
    activated.set(state.items()[nextIndex]);
  }
}

function clampIndex(index: number, state: ListNavigationState) {
  const options = { wrap: false }; // TODO: Add options support.
  const itemCount = state.items().length;
  return options.wrap
    ? (index + itemCount) % itemCount
    : Math.min(Math.max(index, 0), itemCount - 1);
}

function canActivate(index: number, state: ListNavigationState) {
  if (state.disabled?.() || state.items()[index].disabled?.()) {
    return false;
  }
  return true;
}

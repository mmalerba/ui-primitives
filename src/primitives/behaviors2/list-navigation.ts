import { Signal, WritableSignal } from '@angular/core';
import { StateMachine } from '../base/state-machine';

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export interface ListNavigationItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface ListNavigationState<I = unknown> {
  readonly activated: Signal<I | undefined>;
  readonly active: Signal<I | undefined>;
  readonly items: Signal<readonly ListNavigationItemState<I>[]>;
  readonly orientation: Signal<'vertical' | 'horizontal'>;
  readonly direction: Signal<'ltr' | 'rtl'>;
  readonly disabled: Signal<boolean>;
}

export type ListNavigationTransitions = 'activated' | 'active';

export type ListNavigationEvents = 'keydown';

export const DEFAULT_LIST_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export function getListNavigationStateMachine(
  options: ListNavigationOptions = DEFAULT_LIST_NAVIGATION_OPTIONS
): StateMachine<ListNavigationState, ListNavigationTransitions, ListNavigationEvents> {
  options = { ...DEFAULT_LIST_NAVIGATION_OPTIONS, ...options };
  return {
    transitions: {
      activated: (_, activated) => activated,
      active: (state, active) => {
        const item = state.items().find((item) => item.identity === (state.activated() ?? active));
        return item?.disabled() ? undefined : item?.identity;
      },
    },
    events: {
      keydown: ({ activated }, state, event) => handleKeydown(activated, state, event, options),
    },
  };
}

function handleKeydown<I>(
  activated: WritableSignal<I>,
  state: ListNavigationState<I>,
  event: KeyboardEvent,
  options: ListNavigationOptions
) {
  switch (event.key) {
    case 'ArrowDown':
      if (state.orientation() === 'vertical') {
        activateNextItem(activated, state, options);
        event.preventDefault();
      }
      break;
    case 'ArrowUp':
      if (state.orientation() === 'vertical') {
        activatePreviousItem(activated, state, options);
        event.preventDefault();
      }
      break;
    case 'ArrowRight':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activateNextItem(activated, state, options);
        } else {
          activatePreviousItem(activated, state, options);
        }
        event.preventDefault();
      }
      break;
    case 'ArrowLeft':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activatePreviousItem(activated, state, options);
        } else {
          activateNextItem(activated, state, options);
        }
        event.preventDefault();
      }
      break;
  }
}

function getActiveIndex(state: ListNavigationState) {
  const active = state.active();
  return active ? state.items().findIndex((item) => item.identity === active) : -1;
}

function activateNextItem<I>(
  activated: WritableSignal<I>,
  state: ListNavigationState<I>,
  options: ListNavigationOptions
) {
  const currentIndex = getActiveIndex(state);
  let nextIndex = currentIndex;
  do {
    nextIndex = clampIndex(nextIndex + 1, state, options);
  } while (
    !canActivate(nextIndex, state) &&
    nextIndex !== currentIndex &&
    nextIndex < state.items().length - 1
  );
  if (canActivate(nextIndex, state)) {
    activated.set(state.items()[nextIndex].identity);
  }
}

function activatePreviousItem<I>(
  activated: WritableSignal<I>,
  state: ListNavigationState<I>,
  options: ListNavigationOptions
) {
  const currentIndex = getActiveIndex(state);
  let nextIndex = currentIndex;
  do {
    nextIndex = clampIndex(nextIndex - 1, state, options);
  } while (!canActivate(nextIndex, state) && nextIndex !== currentIndex && nextIndex > 0);
  if (canActivate(nextIndex, state)) {
    activated.set(state.items()[nextIndex].identity);
  }
}

function clampIndex(index: number, state: ListNavigationState, options: ListNavigationOptions) {
  const itemCount = state.items().length;
  return options.wrap
    ? (index + itemCount) % itemCount
    : Math.min(Math.max(index, 0), itemCount - 1);
}

function canActivate(index: number, state: ListNavigationState) {
  if (state.disabled() || state.items()[index].disabled()) {
    return false;
  }
  return true;
}

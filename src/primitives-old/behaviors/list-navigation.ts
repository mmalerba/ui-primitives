import { Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export interface ListNavigationItemState<I = unknown> {
  readonly identity: I;
  readonly disabled: Signal<boolean>;
}

export interface ListNavigationState<I = unknown> {
  readonly active: Signal<I | undefined>;
  readonly items: Signal<readonly ListNavigationItemState<I>[]>;
  readonly orientation: Signal<'vertical' | 'horizontal'>;
  readonly direction: Signal<'ltr' | 'rtl'>;
  readonly disabled: Signal<boolean>;

  readonly activated: WritableSignal<I | undefined>;
}

export type ListNavigationTransitions = 'active';

export type ListNavigationEvents = 'keydown';

export const DEFAULT_LIST_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export function getListNavigationBehavior(
  options: ListNavigationOptions = DEFAULT_LIST_NAVIGATION_OPTIONS
): Behavior<ListNavigationState, ListNavigationTransitions, ListNavigationEvents> {
  options = { ...DEFAULT_LIST_NAVIGATION_OPTIONS, ...options };
  return {
    derivations: {
      active: (state, active) => {
        const item = state.items().find((item) => item.identity === (state.activated() ?? active));
        return item?.disabled() ? undefined : item?.identity;
      },
    },
    events: {
      keydown: (state, event) => handleKeydown(state, event, options),
    },
  };
}

function handleKeydown<I>(
  state: ListNavigationState<I>,
  event: KeyboardEvent,
  options: ListNavigationOptions
) {
  switch (event.key) {
    case 'ArrowDown':
      if (state.orientation() === 'vertical') {
        activateNextItem(state, options);
        event.preventDefault();
      }
      break;
    case 'ArrowUp':
      if (state.orientation() === 'vertical') {
        activatePreviousItem(state, options);
        event.preventDefault();
      }
      break;
    case 'ArrowRight':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activateNextItem(state, options);
        } else {
          activatePreviousItem(state, options);
        }
        event.preventDefault();
      }
      break;
    case 'ArrowLeft':
      if (state.orientation() === 'horizontal') {
        if (state.direction() === 'ltr') {
          activatePreviousItem(state, options);
        } else {
          activateNextItem(state, options);
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

function activateNextItem<I>(state: ListNavigationState<I>, options: ListNavigationOptions) {
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
    state.activated.set(state.items()[nextIndex].identity);
  }
}

function activatePreviousItem<I>(state: ListNavigationState<I>, options: ListNavigationOptions) {
  const currentIndex = getActiveIndex(state);
  let nextIndex = currentIndex;
  do {
    nextIndex = clampIndex(nextIndex - 1, state, options);
  } while (!canActivate(nextIndex, state) && nextIndex !== currentIndex && nextIndex > 0);
  if (canActivate(nextIndex, state)) {
    state.activated.set(state.items()[nextIndex].identity);
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

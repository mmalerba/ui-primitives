import { computed, Signal } from '@angular/core';
import { hasFocus } from '../base/dom';
import { StateMachine } from '../base/state-machine';

export interface RovingTabindexOptions {}

export interface RovingTabindexItemState<I = unknown> {
  readonly identity: I;
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
}

export interface RovingTabindexState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly RovingTabindexItemState<I>[]>;
  readonly focused: Signal<[HTMLElement | undefined]>;
  readonly active: Signal<I | undefined>;
  readonly tabindex: Signal<number | undefined>;
  readonly activeDescendantId: Signal<string | undefined>;
  readonly disabled: Signal<boolean>;
}

export type RovingTabindexTransitions =
  | 'focused'
  | 'active'
  | 'tabindex'
  | 'activeDescendantId'
  | 'items';

export type RovingTabindexEvents = 'focusin' | 'focusout';

export const DEFAULT_ROVING_TABINDEX_OPTIONS: RovingTabindexOptions = {};

export function getRovingTabindexStateMachine(
  options: RovingTabindexOptions = DEFAULT_ROVING_TABINDEX_OPTIONS
): StateMachine<RovingTabindexState, RovingTabindexTransitions, RovingTabindexEvents> {
  options = { ...DEFAULT_ROVING_TABINDEX_OPTIONS, ...options };
  return {
    transitions: {
      focused: (state, focused) => {
        const element = state.items().find((item) => item.identity === state.active())?.element;
        return hasFocus(state.element) ? [element] : focused;
      },
      active: (state, active) => {
        const activeItem = state.items().find((item) => item.identity === active);
        return !activeItem || activeItem.disabled()
          ? getFirstActivatableItem(state)?.identity
          : activeItem?.identity;
      },
      tabindex: () => -1,
      activeDescendantId: () => undefined,
      items: (state, items) => {
        return items.map((item) => ({
          ...item,
          tabindex: computed(() =>
            !state.disabled() && item.identity === state.active() ? 0 : -1
          ),
        }));
      },
    },
    events: {
      focusin: ({ focused }, state) => {
        if (!state.disabled()) {
          focused.set([state.items().find((item) => item.identity === state.active())?.element]);
        }
      },
      focusout: ({ focused }, state, event) => {
        const targetRemoved = !state.items().some((item) => item.element === event.target);
        if (targetRemoved) {
          focused.set([getFirstActivatableItem(state)?.element]);
        }
      },
    },
  };
}

function getFirstActivatableItem(state: RovingTabindexState): RovingTabindexItemState | undefined {
  for (const item of state.items()) {
    if (!item.disabled()) {
      return item;
    }
  }
  return undefined;
}

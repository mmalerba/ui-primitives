import { computed, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { getActiveElement } from '../base/dom';

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

  readonly hasFocus: WritableSignal<boolean>;
}

export type RovingTabindexTransitions =
  | 'focused'
  | 'active'
  | 'tabindex'
  | 'activeDescendantId'
  | 'items'
  | 'hasFocus';

export type RovingTabindexEvents = 'focusin' | 'focusout';

export const DEFAULT_ROVING_TABINDEX_OPTIONS: RovingTabindexOptions = {};

export function getRovingTabindexBehavior(
  options: RovingTabindexOptions = DEFAULT_ROVING_TABINDEX_OPTIONS
): Behavior<RovingTabindexState, RovingTabindexTransitions, RovingTabindexEvents> {
  options = { ...DEFAULT_ROVING_TABINDEX_OPTIONS, ...options };
  return {
    derivations: {
      focused: (state) => {
        state.active();
        const element = state.items().find((item) => item.identity === state.active())?.element;
        return [state.hasFocus() ? element : undefined];
      },
      active: (state, active) => {
        if (state.disabled()) {
          return undefined;
        }
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
      hasFocus: (state) => state.element.contains(getActiveElement()),
    },
    events: {
      focusin: ({ hasFocus }) => {
        hasFocus.set(true);
      },
      focusout: async (state) => {
        state.hasFocus.set(false);

        // Check if focus was lost due to the active element being removed from the DOM.
        // If so, recapture focus.
        const originalActive = state.active();
        await Promise.resolve();
        const newActive = state.active();
        if (newActive && newActive !== originalActive) {
          state.hasFocus.set(true);
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

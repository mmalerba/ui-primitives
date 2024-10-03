import { signal, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { getActiveElement } from '../base/dom';

export interface ActiveDescendantOptions {}

export interface ActiveDescendantItemState<I = unknown> {
  readonly element: HTMLElement;
  readonly identity: I;
  readonly id: Signal<string>;
  readonly tabindex: Signal<0 | -1>;
}

export interface ActiveDescendantState<I = unknown> {
  readonly element: HTMLElement;
  readonly items: Signal<readonly ActiveDescendantItemState<I>[]>;
  readonly active: Signal<I | undefined>;
  readonly activeDescendantId: Signal<string | undefined>;
  readonly tabindex: Signal<0 | -1>;
  readonly disabled: Signal<boolean>;
  readonly focused: Signal<[HTMLElement | undefined]>;

  readonly hasFocus: WritableSignal<boolean>;
}

export type ActiveDescendantTransitions =
  | 'activeDescendantId'
  | 'tabindex'
  | 'items'
  | 'focused'
  | 'hasFocus';

export type ActiveDescendantEvents = 'focusin' | 'focusout';

export const DEFAULT_ACTIVE_DESCENDANT_OPTIONS: ActiveDescendantOptions = {};

export function getActiveDescendantBehavior(
  options: ActiveDescendantOptions = DEFAULT_ACTIVE_DESCENDANT_OPTIONS
): Behavior<ActiveDescendantState, ActiveDescendantTransitions, ActiveDescendantEvents> {
  options = { ...DEFAULT_ACTIVE_DESCENDANT_OPTIONS, ...options };
  return {
    derivations: {
      activeDescendantId: (state) =>
        state
          .items()
          .find((i) => i.identity === state.active())
          ?.id(),
      tabindex: (state) => (state.disabled() ? -1 : 0),
      items: (_, items) =>
        items.map((item) => ({
          ...item,
          tabindex: signal(-1),
        })),
      focused: (state) => [state.hasFocus() ? state.element : undefined],
      hasFocus: (state) => state.element.contains(getActiveElement()),
    },
    events: {
      focusin: ({ hasFocus }) => {
        hasFocus.set(true);
      },
      focusout: ({ hasFocus }) => {
        hasFocus.set(false);
      },
    },
  };
}

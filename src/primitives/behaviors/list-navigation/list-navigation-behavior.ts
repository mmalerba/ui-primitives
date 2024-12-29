import { Signal, WritableSignal } from '@angular/core';
import { Behavior, State, writable } from '../../base/behavior';

export interface ListNavigationBehaviorInputs {
  readonly wrapNavigation: Signal<boolean>;
  readonly navigationSkipsDisabled: Signal<boolean>;
  readonly activatedElement: Signal<HTMLElement | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
}

export interface ListNavigationBehaviorItemInputs {
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
}

export interface ListNavigationBehaviorOutputs {
  readonly activatedElement: WritableSignal<Element | null>;
  readonly activeIndex: Signal<number>;
}

export interface ListNavigationBehaviorItemOutputs {
  readonly active: Signal<boolean>;
}

export type ListNavigationState = State<
  ListNavigationBehaviorInputs,
  ListNavigationBehaviorOutputs
>;

export type ListNavigationItemState = State<
  ListNavigationBehaviorItemInputs,
  ListNavigationBehaviorItemOutputs
>;

export const listNavigationBehavior: Behavior<
  ListNavigationBehaviorInputs,
  ListNavigationBehaviorItemInputs,
  ListNavigationBehaviorOutputs,
  ListNavigationBehaviorItemOutputs
> = {
  computations: {
    activatedElement: writable(({ inputValue }) => inputValue()),
    activeIndex: ({ self, items }) => {
      const idx = items().findIndex((item) => item.element === self.activatedElement());
      return idx === -1 && items().length ? 0 : idx;
    },
  },
  itemComputations: {
    active: ({ parent, index }) => parent.activeIndex() === index(),
  },
};

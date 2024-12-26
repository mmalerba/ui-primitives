import { Signal, WritableSignal } from '@angular/core';
import { Behavior, State } from '../../base/behavior';

export interface ListNavigationBehaviorInputs {
  readonly wrapNavigation: Signal<boolean>;
  readonly navigationSkipsDisabled: Signal<boolean>;
}

export interface ListNavigationBehaviorItemInputs {
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
}

export interface ListNavigationBehaviorOutputs {
  readonly activeElement: WritableSignal<Element | null>;
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
    activeElement: () => null,
    activeIndex: ({ self, items }) =>
      items().findIndex((item) => item.element === self.activeElement()),
  },
  itemComputations: {
    active: ({ parent, index }) => parent.activeIndex() === index(),
  },
  makeWritable: {
    parent: {
      activeElement: true,
    },
  },
};

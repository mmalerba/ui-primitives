import { Signal } from '@angular/core';
import { Behavior, State } from '../../base/behavior';

export interface FocusBehaviorInputs {
  readonly element: HTMLElement;
  readonly activeIndex: Signal<number>;
}

export interface FocusBehaviorItemInputs {
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
}

export interface FocusBehaviorOutputs {
  readonly tabindex: Signal<0 | -1>;
}

export interface FocusBehaviorItemOutputs {
  readonly tabindex: Signal<0 | -1>;
}

export type FocusState = State<FocusBehaviorInputs, FocusBehaviorOutputs>;

export type FocusItemState = State<FocusBehaviorItemInputs, FocusBehaviorItemOutputs>;

export const focusBehavior: Behavior<
  FocusBehaviorInputs,
  FocusBehaviorItemInputs,
  FocusBehaviorOutputs,
  FocusBehaviorItemOutputs
> = {
  computations: {
    tabindex: () => -1,
  },
  itemComputations: {
    tabindex: ({ self, parent, index }) =>
      !self.disabled() && parent.activeIndex() === index() ? 0 : -1,
  },
  sync: [
    ({ parent, items }) => {
      parent.activeIndex();

      if (typeof document === 'undefined' || !parent.element.contains(document.activeElement)) {
        return;
      }

      items()[parent.activeIndex()]?.element.focus();
    },
  ],
};

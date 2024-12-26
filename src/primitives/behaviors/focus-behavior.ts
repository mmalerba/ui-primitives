import { Signal } from '@angular/core';
import { Behavior, State } from '../base/behavior';

export interface FocusBehaviorInputs {
  readonly activeIndex: Signal<number>;
}

export interface FocusBehaviorItemInputs {}

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
    tabindex: () => 0,
  },
  itemComputations: {
    tabindex: ({ parent, index }) => (parent.activeIndex() === index() ? 0 : -1),
  },
};

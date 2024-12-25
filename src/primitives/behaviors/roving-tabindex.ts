import { Signal } from '@angular/core';
import { Behavior, State } from '../base/behavior';

export interface RovingTabindexInputs {
  activeIndex: Signal<number>;
}

export interface RovingTabindexItemInputs {}

export interface RovingTabindexOutputs {
  tabindex: Signal<number>;
}

export interface RovingTabindexItemOutputs {
  tabindex: Signal<number>;
  active: Signal<boolean>;
}

export type RovingTabindexState = State<RovingTabindexInputs, RovingTabindexOutputs>;

export type RovingTabindexItemState = State<RovingTabindexItemInputs, RovingTabindexItemOutputs>;

export const rovingTabindexBehavior: Behavior<
  RovingTabindexInputs,
  RovingTabindexItemInputs,
  RovingTabindexOutputs,
  RovingTabindexItemOutputs
> = {
  computations: {
    tabindex: () => 0,
  },
  itemComputations: {
    tabindex: ({ parent, index }) => (parent.activeIndex() === index() ? 0 : -1),
    active: ({ self }) => self.tabindex() === 0,
  },
};

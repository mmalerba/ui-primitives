import { Signal, WritableSignal } from '@angular/core';
import { Behavior, State } from '../base/behavior';

export interface NavigationBehaviorInputs {}

export interface NavigationBehaviorItemInputs {
  readonly element: HTMLElement;
}

export interface NavigationBehaviorOutputs {
  readonly activeElement: WritableSignal<Element | null>;
  readonly activeIndex: Signal<number>;
}

export interface NavigationBehaviorItemOutputs {
  readonly active: Signal<boolean>;
}

export type NavigationState = State<NavigationBehaviorInputs, NavigationBehaviorOutputs>;

export type NavigationItemState = State<
  NavigationBehaviorItemInputs,
  NavigationBehaviorItemOutputs
>;

export const navigationBehavior: Behavior<
  NavigationBehaviorInputs,
  NavigationBehaviorItemInputs,
  NavigationBehaviorOutputs,
  NavigationBehaviorItemOutputs
> = {
  computations: {
    activeElement: () => null,
    activeIndex: () => -1,
  },
  itemComputations: {
    active: () => true,
  },
  makeWritable: {
    parent: {
      activeElement: true,
    },
  },
};

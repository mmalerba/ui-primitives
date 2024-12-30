import { Signal } from '@angular/core';
import { Behavior, State } from '../../base/behavior';

export interface CompositeDisabledBehaviorInputs {
  readonly disabled: Signal<boolean>;
}

export interface CompositeDisabledBehaviorItemInputs {
  readonly disabled: Signal<boolean>;
}

export interface CompositeDisabledBehaviorOutputs {
  readonly compositeDisabled: Signal<boolean>;
}

export interface CompositeDisabledBehaviorItemOutputs {
  readonly compositeDisabled: Signal<boolean>;
}

export type CompositeDisabledState = State<
  CompositeDisabledBehaviorInputs,
  CompositeDisabledBehaviorOutputs
>;

export type CompositeDisabledItemState = State<
  CompositeDisabledBehaviorItemInputs,
  CompositeDisabledBehaviorItemOutputs
>;

export const compositeDisabledBehavior: Behavior<
  CompositeDisabledBehaviorInputs,
  CompositeDisabledBehaviorItemInputs,
  CompositeDisabledBehaviorOutputs,
  CompositeDisabledBehaviorItemOutputs
> = {
  computations: {
    compositeDisabled: ({ self, items }) =>
      self.disabled() || items().every((item) => item.disabled()),
  },
  itemComputations: {
    compositeDisabled: ({ self, parent }) => self.disabled() || parent.disabled(),
  },
};

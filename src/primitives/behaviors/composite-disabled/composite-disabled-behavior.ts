import { Signal } from '@angular/core';
import { Behavior, ItemStateType, ParentStateType } from '../../base/behavior';

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

export type CompositeDisabledBehavior = Behavior<
  CompositeDisabledBehaviorInputs,
  CompositeDisabledBehaviorItemInputs,
  CompositeDisabledBehaviorOutputs,
  CompositeDisabledBehaviorItemOutputs
>;

export type CompositeDisabledState = ParentStateType<CompositeDisabledBehavior>;

export type CompositeDisabledItemState = ItemStateType<CompositeDisabledBehavior>;

export const compositeDisabledBehavior: CompositeDisabledBehavior = {
  computations: {
    compositeDisabled: ({ self, items }) =>
      self.disabled() || items().every((item) => item.disabled()),
  },
  itemComputations: {
    compositeDisabled: ({ self, parent }) => self.disabled() || parent.disabled(),
  },
};

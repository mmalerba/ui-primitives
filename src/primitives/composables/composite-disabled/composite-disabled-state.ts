import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export interface CompositeDisabledInputs {
  readonly disabled: Signal<boolean>;
}

export interface CompositeDisabledItemInputs {
  readonly disabled: Signal<boolean>;
}

export interface CompositeDisabledOutputs {
  readonly compositeDisabled: Signal<boolean>;
}

export interface CompositeDisabledItemOutputs {
  readonly compositeDisabled: Signal<boolean>;
}

export type CompositeDisabledSchema = StateSchema<
  CompositeDisabledInputs,
  CompositeDisabledItemInputs,
  CompositeDisabledOutputs,
  CompositeDisabledItemOutputs
>;

export type CompositeDisabledState = ParentStateType<CompositeDisabledSchema>;

export type CompositeDisabledItemState = ItemStateType<CompositeDisabledSchema>;

const schema: CompositeDisabledSchema = {
  computations: {
    compositeDisabled: ({ self, items }) =>
      self.disabled() || items().every((item) => item.disabled()),
  },
  itemComputations: {
    compositeDisabled: ({ self, parent }) => self.disabled() || parent.disabled(),
  },
};

export const compositeDisabledSchema = () => schema;

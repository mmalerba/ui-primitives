import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export type CompositeDisabledInputs = {
  readonly explicitDisabled: Signal<boolean>;
};

export type CompositeDisabledItemInputs = {
  readonly explicitDisabled: Signal<boolean>;
};

export type CompositeDisabledOutputs = {
  readonly disabled: Signal<boolean>;
};

export type CompositeDisabledItemOutputs = {
  readonly disabled: Signal<boolean>;
};

export type CompositeDisabledStateSchema = StateSchema<
  CompositeDisabledInputs,
  CompositeDisabledItemInputs,
  CompositeDisabledOutputs,
  CompositeDisabledItemOutputs
>;

export type CompositeDisabledState = ParentStateType<CompositeDisabledStateSchema>;

export type CompositeDisabledItemState = ItemStateType<CompositeDisabledStateSchema>;

const schema: CompositeDisabledStateSchema = {
  computations: {
    parent: {
      disabled: ({ self, items }) =>
        self.explicitDisabled() || items().every((item) => item.explicitDisabled()),
    },
    item: {
      disabled: ({ self, parent }) => self.explicitDisabled() || parent.explicitDisabled(),
    },
  },
};

export const compositeDisabledStateSchema = () => schema;

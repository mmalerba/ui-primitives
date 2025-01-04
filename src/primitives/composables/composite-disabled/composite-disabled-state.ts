import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export type CompositeDisabledInputs = {
  readonly disabled: Signal<boolean>;
};

export type CompositeDisabledItemInputs = {
  readonly disabled: Signal<boolean>;
};

export type CompositeDisabledOutputs = {
  readonly compositeDisabled: Signal<boolean>;
};

export type CompositeDisabledItemOutputs = {
  readonly compositeDisabled: Signal<boolean>;
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
      compositeDisabled: ({ self, items }) =>
        self.disabled() || items().every((item) => item.disabled()),
    },
    item: {
      compositeDisabled: ({ self, parent }) => self.disabled() || parent.disabled(),
    },
  },
};

export const compositeDisabledStateSchema = () => schema;

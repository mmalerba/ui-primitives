import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';

export type TypeaheadInputs = {
  readonly activatedElement: Signal<HTMLElement | null>;
};

export type TypeaheadItemInputs = {
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
};

export type TypeaheadOutputs = {
  readonly activatedElement: WritableSignal<Element | null>;
};

export type TypeaheadItemOutputs = {};

export type TypeaheadStateSchema = StateSchema<
  TypeaheadInputs,
  TypeaheadItemInputs,
  TypeaheadOutputs,
  TypeaheadItemOutputs
>;

export type TypeaheadState = ParentStateType<TypeaheadStateSchema>;

export type TypeaheadItemState = ItemStateType<TypeaheadStateSchema>;

const schema: TypeaheadStateSchema = {
  computations: {
    parent: {
      activatedElement: writable(({ inputValue }) => inputValue()),
    },
  },
};

export function typeaheadStateSchema(): TypeaheadStateSchema {
  return schema;
}

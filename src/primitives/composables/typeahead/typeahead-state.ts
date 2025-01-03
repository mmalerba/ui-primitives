import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';

export interface TypeaheadInputs {
  readonly activatedElement: Signal<HTMLElement | null>;
}

export interface TypeaheadItemInputs {
  readonly element: HTMLElement;
  readonly compositeDisabled: Signal<boolean>;
}

export interface TypeaheadOutputs {
  readonly activatedElement: WritableSignal<Element | null>;
}

export type TypeaheadItemOutputs = {};

export type TypeaheadSchema = StateSchema<
  TypeaheadInputs,
  TypeaheadItemInputs,
  TypeaheadOutputs,
  TypeaheadItemOutputs
>;

export type TypeaheadState = ParentStateType<TypeaheadSchema>;

export type TypeaheadItemState = ItemStateType<TypeaheadSchema>;

const schema: TypeaheadSchema = {
  computations: {
    activatedElement: writable(({ inputValue }) => inputValue()),
  },
};

export function typeaheadSchema(): TypeaheadSchema {
  return schema;
}

import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';

export interface SelectionInputs<T> {
  readonly activeIndex: Signal<number>;
  readonly selectedValues: Signal<readonly T[]>;
  readonly selectionType: Signal<'single' | 'multiple'>;
  readonly compareValues: Signal<(a: T, b: T) => boolean>;
}

export interface SelectionItemInputs<T> {
  readonly value: Signal<T>;
  readonly disabled: Signal<boolean>;
}

export interface SelectionOutputs<T> {
  readonly selectedValues: WritableSignal<readonly T[]>;
  readonly selectedIndices: Signal<readonly number[]>;
  readonly lastSelectedIndex: WritableSignal<number>;
}

export interface SelectionItemOutputs {
  readonly selected: Signal<boolean>;
}

export type SelectionSchema<T> = StateSchema<
  SelectionInputs<T>,
  SelectionItemInputs<T>,
  SelectionOutputs<T>,
  SelectionItemOutputs
>;

export type SelectionState<T> = ParentStateType<SelectionSchema<T>>;

export type SelectionItemState<T> = ItemStateType<SelectionSchema<T>>;

export function getSelectionSchema<T>(): SelectionSchema<T> {
  return {
    computations: {
      selectedValues: writable(({ inputValue }) => inputValue()),
      selectedIndices: ({ self, items }) =>
        items().reduce<number[]>((acc, item, idx) => {
          if (self.selectedValues().some((v) => self.compareValues()(v, item.value()))) {
            acc.push(idx);
          }
          return acc;
        }, []),
      lastSelectedIndex: writable(() => -1),
    },
    itemComputations: {
      selected: ({ parent, index }) => parent.selectedIndices().includes(index()),
    },
  };
}

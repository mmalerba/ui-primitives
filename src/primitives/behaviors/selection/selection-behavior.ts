import { Signal, WritableSignal } from '@angular/core';
import { Behavior, ItemStateType, ParentStateType, writable } from '../../base/behavior';

export interface SelectionBehaviorInputs<T> {
  readonly activeIndex: Signal<number>;
  readonly selectedValues: Signal<readonly T[]>;
  readonly selectionType: Signal<'single' | 'multiple'>;
  readonly compareValues: Signal<(a: T, b: T) => boolean>;
}

export interface SelectionBehaviorItemInputs<T> {
  readonly value: Signal<T>;
  readonly disabled: Signal<boolean>;
}

export interface SelectionBehaviorOutputs<T> {
  readonly selectedValues: WritableSignal<readonly T[]>;
  readonly selectedIndices: Signal<readonly number[]>;
  readonly lastSelectedIndex: WritableSignal<number>;
}

export interface SelectionBehaviorItemOutputs {
  readonly selected: Signal<boolean>;
}

export type SelectionBehavior<T> = Behavior<
  SelectionBehaviorInputs<T>,
  SelectionBehaviorItemInputs<T>,
  SelectionBehaviorOutputs<T>,
  SelectionBehaviorItemOutputs
>;

export type SelectionState<T> = ParentStateType<SelectionBehavior<T>>;

export type SelectionItemState<T> = ItemStateType<SelectionBehavior<T>>;

export function getSelectionBehavior<T>(): SelectionBehavior<T> {
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

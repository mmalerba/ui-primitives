import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';

export type SelectionType = 'single' | 'multiple';

export type SelectionStrategy = 'followfocus' | 'explicit';

export type SelectionInputs<T> = {
  readonly activeIndex: Signal<number>;
  readonly selectedValues: Signal<Set<T>>;
  readonly selectionType: Signal<SelectionType>;
  readonly selectionStrategy: Signal<SelectionStrategy>;
  readonly compareValues: Signal<(a: T, b: T) => boolean>;
  readonly disabled: Signal<boolean>;
};

export type SelectionOptionInputs<T> = {
  readonly element: HTMLElement;
  readonly value: Signal<T>;
  readonly disabled: Signal<boolean>;
};

export type SelectionOutputs<T> = {
  readonly selectedValues: WritableSignal<Set<T>>;
  readonly selectedIndices: Signal<readonly number[]>;
  readonly lastSelectedIndex: WritableSignal<number>;
};

export type SelectionOptionOutputs = {
  readonly selected: Signal<boolean>;
};

export type SelectionStateSchema<T> = StateSchema<
  SelectionInputs<T>,
  SelectionOptionInputs<T>,
  SelectionOutputs<T>,
  SelectionOptionOutputs
>;

export type SelectionState<T> = ParentStateType<SelectionStateSchema<T>>;

export type SelectionOptionState<T> = ItemStateType<SelectionStateSchema<T>>;

const schema: SelectionStateSchema<unknown> = {
  computations: {
    parent: {
      selectedValues: writable(({ inputValue }) => inputValue()),
      selectedIndices: ({ self, items }) =>
        items().reduce<number[]>((acc, item, idx) => {
          if (containsValue(self.selectedValues(), item.value(), self.compareValues())) {
            acc.push(idx);
          }
          return acc;
        }, []),
      lastSelectedIndex: writable(() => -1),
    },
    item: {
      selected: ({ parent, index }) => parent.selectedIndices().includes(index()),
    },
  },
};

export function selectionStateSchema<T>(): SelectionStateSchema<T> {
  return schema as SelectionStateSchema<T>;
}

export function containsValue<T>(
  values: Set<T>,
  value: T,
  compare?: (a: T, b: T) => boolean,
): boolean {
  if (values.has(value)) {
    return true;
  }
  if (compare) {
    for (const v of values) {
      if (compare(v, value)) {
        return true;
      }
    }
  }
  return false;
}

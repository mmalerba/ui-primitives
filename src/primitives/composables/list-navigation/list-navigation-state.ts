import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';

export type ListNavigationInputs = {
  readonly activatedElement: Signal<HTMLElement | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
};

export type ListNavigationItemInputs = {
  readonly element: HTMLElement;
  readonly disabled: Signal<boolean>;
};

export type ListNavigationOutputs = {
  readonly activatedElement: WritableSignal<Element | null>;
  readonly activeIndex: Signal<number>;
};

export type ListNavigationItemOutputs = {
  readonly active: Signal<boolean>;
};

export type ListNavigationStateSchema = StateSchema<
  ListNavigationInputs,
  ListNavigationItemInputs,
  ListNavigationOutputs,
  ListNavigationItemOutputs
>;

export type ListNavigationState = ParentStateType<ListNavigationStateSchema>;

export type ListNavigationItemState = ItemStateType<ListNavigationStateSchema>;

const schema: ListNavigationStateSchema = {
  computations: {
    parent: {
      activatedElement: writable(({ inputValue }) => inputValue()),
      activeIndex: ({ self, items }) => {
        const idx = items().findIndex((item) => item.element === self.activatedElement());
        return idx === -1 && items().length
          ? getIndex(items, -1, (i) => getNextIndex(items, i, false))
          : idx;
      },
    },
    item: {
      active: ({ parent, index }) => parent.activeIndex() === index(),
    },
  },
};

export const listNavigationStateSchema = () => schema;

export function getNextIndex(
  items: Signal<readonly ListNavigationItemState[]>,
  index: number,
  wrap: boolean,
): number {
  return wrap && index === items().length - 1 ? 0 : index + 1;
}

export function getIndex(
  items: Signal<readonly ListNavigationItemState[]>,
  initial: number,
  navigateFn: (i: number) => number,
): number {
  const startIndex = navigateFn(initial);
  let index = startIndex;
  while (true) {
    // Don't navigate if we go past the end of the list.
    if (index < 0 || index >= items().length) {
      return -1;
    }
    // If we land on a non-disabled item, stop and navigate to it.
    if (!items()[index].disabled()) {
      break;
    }

    index = navigateFn(index);

    // Don't navigate if we loop back around to our starting position.
    if (index === startIndex) {
      return -1;
    }
  }

  return index;
}

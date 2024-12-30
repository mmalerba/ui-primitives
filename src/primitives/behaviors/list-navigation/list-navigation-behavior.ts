import { Signal, WritableSignal } from '@angular/core';
import { Behavior, State, writable } from '../../base/behavior';

export interface ListNavigationBehaviorInputs {
  readonly wrapNavigation: Signal<boolean>;
  readonly activatedElement: Signal<HTMLElement | null>;
  readonly orientation: Signal<'horizontal' | 'vertical'>;
}

export interface ListNavigationBehaviorItemInputs {
  readonly element: HTMLElement;
  readonly compositeDisabled: Signal<boolean>;
}

export interface ListNavigationBehaviorOutputs {
  readonly activatedElement: WritableSignal<Element | null>;
  readonly activeIndex: Signal<number>;
}

export interface ListNavigationBehaviorItemOutputs {
  readonly active: Signal<boolean>;
}

export type ListNavigationState = State<
  ListNavigationBehaviorInputs,
  ListNavigationBehaviorOutputs
>;

export type ListNavigationItemState = State<
  ListNavigationBehaviorItemInputs,
  ListNavigationBehaviorItemOutputs
>;

export const listNavigationBehavior: Behavior<
  ListNavigationBehaviorInputs,
  ListNavigationBehaviorItemInputs,
  ListNavigationBehaviorOutputs,
  ListNavigationBehaviorItemOutputs
> = {
  computations: {
    activatedElement: writable(({ inputValue }) => inputValue()),
    activeIndex: ({ self, items }) => {
      const idx = items().findIndex((item) => item.element === self.activatedElement());
      return idx === -1 && items().length
        ? getIndex(items, -1, (i) => getNextIndex(self, items, i))
        : idx;
    },
  },
  itemComputations: {
    active: ({ parent, index }) => parent.activeIndex() === index(),
  },
};

export function getNextIndex(
  list: ListNavigationState,
  items: Signal<readonly ListNavigationItemState[]>,
  index: number,
): number {
  return list.wrapNavigation() && index === items().length - 1 ? 0 : index + 1;
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
    if (!items()[index].compositeDisabled()) {
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

import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export interface CompositeFocusInputs {
  readonly element: HTMLElement;
  readonly activeIndex: Signal<number>;
  readonly focusStrategy: Signal<'activedescendant' | 'rovingtabindex'>;
  readonly compositeDisabled: Signal<boolean>;
}

export interface CompositeFocusItemInputs {
  readonly element: HTMLElement;
  readonly compositeDisabled: Signal<boolean>;
  readonly id: Signal<string>;
}

export interface CompositeFocusOutputs {
  readonly tabindex: Signal<0 | -1>;
  readonly activeDescendantId: Signal<string | undefined>;
}

export interface CompositeFocusItemOutputs {
  readonly tabindex: Signal<0 | -1>;
}

export type CompositeFocusSchema = StateSchema<
  CompositeFocusInputs,
  CompositeFocusItemInputs,
  CompositeFocusOutputs,
  CompositeFocusItemOutputs
>;

export type CompositeFocusState = ParentStateType<CompositeFocusSchema>;

export type CompositeFocusItemState = ItemStateType<CompositeFocusSchema>;

export const compositeFocusSchema: CompositeFocusSchema = {
  computations: {
    tabindex: ({ self }) =>
      self.focusStrategy() === 'activedescendant' && !self.compositeDisabled() ? 0 : -1,
    activeDescendantId: ({ self, items }) =>
      self.focusStrategy() === 'activedescendant' ? items()[self.activeIndex()]?.id() : undefined,
  },
  itemComputations: {
    tabindex: ({ self, parent, index }) =>
      parent.focusStrategy() === 'rovingtabindex' &&
      !self.compositeDisabled() &&
      parent.activeIndex() === index()
        ? 0
        : -1,
  },
  sync: [
    ({ parent, items }) => {
      parent.focusStrategy();
      parent.activeIndex();
      items();

      if (typeof document === 'undefined' || !parent.element.contains(document.activeElement)) {
        return;
      }

      if (parent.focusStrategy() === 'rovingtabindex') {
        items()[parent.activeIndex()]?.element.focus();
      } else {
        parent.element.focus();
        items()[parent.activeIndex()]?.element.scrollIntoView({
          block: 'nearest',
        });
      }
    },
  ],
};

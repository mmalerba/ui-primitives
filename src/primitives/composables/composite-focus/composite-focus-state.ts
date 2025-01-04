import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export type CompositeFocusInputs = {
  readonly element: HTMLElement;
  readonly activeIndex: Signal<number>;
  readonly focusStrategy: Signal<'activedescendant' | 'rovingtabindex'>;
  readonly compositeDisabled: Signal<boolean>;
};

export type CompositeFocusItemInputs = {
  readonly element: HTMLElement;
  readonly compositeDisabled: Signal<boolean>;
  readonly id: Signal<string>;
};

export type CompositeFocusOutputs = {
  readonly tabindex: Signal<0 | -1>;
  readonly activeDescendantId: Signal<string | undefined>;
};

export type CompositeFocusItemOutputs = {
  readonly tabindex: Signal<0 | -1>;
};

export type CompositeFocusStateSchema = StateSchema<
  CompositeFocusInputs,
  CompositeFocusItemInputs,
  CompositeFocusOutputs,
  CompositeFocusItemOutputs
>;

export type CompositeFocusState = ParentStateType<CompositeFocusStateSchema>;

export type CompositeFocusItemState = ItemStateType<CompositeFocusStateSchema>;

const schema: CompositeFocusStateSchema = {
  computations: {
    parent: {
      tabindex: ({ self }) =>
        self.focusStrategy() === 'activedescendant' && !self.compositeDisabled() ? 0 : -1,
      activeDescendantId: ({ self, items }) =>
        self.focusStrategy() === 'activedescendant' ? items()[self.activeIndex()]?.id() : undefined,
    },
    item: {
      tabindex: ({ self, parent, index }) =>
        parent.focusStrategy() === 'rovingtabindex' &&
        !self.compositeDisabled() &&
        parent.activeIndex() === index()
          ? 0
          : -1,
    },
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

export const compositeFocusStateSchema = () => schema;

import {
  composeBehavior,
  ItemInputType,
  ItemOutputType,
  ParentInputType,
  ParentOutputType,
} from '../../base/behavior';
import { compositeDisabledBehavior } from '../composite-disabled/composite-disabled-behavior';
import { compositeFocusBehavior } from '../composite-focus/composite-focus-behavior';
import { listNavigationBehavior } from '../list-navigation/list-navigation-behavior';
import { getSelectionBehavior } from '../selection/selection-behavior';

export type ListboxBehavior = ReturnType<typeof getListboxBehavior>;

export type ListboxBehaviorInputs = ParentInputType<ListboxBehavior>;

export type ListboxBehaviorItemInputs = ItemInputType<ListboxBehavior>;

export type ListboxBehaviorOutputs = ParentOutputType<ListboxBehavior>;

export type ListboxBehaviorItemOutputs = ItemOutputType<ListboxBehavior>;

export type ListboxState = ParentInputType<ListboxBehavior>;

export type ListboxItemState = ItemInputType<ListboxBehavior>;

export function getListboxBehavior<T>() {
  return composeBehavior(
    composeBehavior(
      compositeDisabledBehavior,
      composeBehavior(listNavigationBehavior, compositeFocusBehavior),
    ),
    getSelectionBehavior<T>(),
  );
}

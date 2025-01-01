import {
  composeSchema,
  ItemInputType,
  ItemOutputType,
  ParentInputType,
  ParentOutputType,
} from '../../base/state';
import { compositeDisabledSchema } from '../composite-disabled/composite-disabled-state';
import { compositeFocusSchema } from '../composite-focus/composite-focus-state';
import { listNavigationSchema } from '../list-navigation/list-navigation-state';
import { getSelectionSchema } from '../selection/selection-state';

export type ListboxSchema = ReturnType<typeof getListboxSchema>;

export type ListboxInputs = ParentInputType<ListboxSchema>;

export type ListboxItemInputs = ItemInputType<ListboxSchema>;

export type ListboxOutputs = ParentOutputType<ListboxSchema>;

export type ListboxItemOutputs = ItemOutputType<ListboxSchema>;

export type ListboxState = ParentInputType<ListboxSchema>;

export type ListboxItemState = ItemInputType<ListboxSchema>;

export function getListboxSchema<T>() {
  return composeSchema(
    composeSchema(
      compositeDisabledSchema,
      composeSchema(listNavigationSchema, compositeFocusSchema),
    ),
    getSelectionSchema<T>(),
  );
}

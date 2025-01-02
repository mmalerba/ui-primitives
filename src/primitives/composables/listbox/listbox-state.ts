import {
  composeSchema,
  ItemInputType,
  ItemOutputType,
  ItemStateType,
  ParentInputType,
  ParentOutputType,
  ParentStateType,
} from '../../base/state';
import { compositeDisabledSchema } from '../composite-disabled/composite-disabled-state';
import { compositeFocusSchema } from '../composite-focus/composite-focus-state';
import { listNavigationSchema } from '../list-navigation/list-navigation-state';
import { selectionSchema } from '../selection/selection-state';

export type ListboxSchema<T> = ReturnType<typeof listboxSchema<T>>;

export type ListboxInputs<T> = ParentInputType<ListboxSchema<T>>;

export type ListboxOptionInputs<T> = ItemInputType<ListboxSchema<T>>;

export type ListboxOutputs<T> = ParentOutputType<ListboxSchema<T>>;

export type ListboxOptionOutputs<T> = ItemOutputType<ListboxSchema<T>>;

export type ListboxState<T> = ParentStateType<ListboxSchema<T>>;

export type ListboxOptionState<T> = ItemStateType<ListboxSchema<T>>;

export function listboxSchema<T>() {
  return composeSchema(
    composeSchema(
      compositeDisabledSchema(),
      composeSchema(listNavigationSchema(), compositeFocusSchema()),
    ),
    selectionSchema<T>(),
  );
}

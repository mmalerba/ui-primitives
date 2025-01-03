import {
  composeSchema,
  ItemInputType,
  ItemOutputType,
  ItemStateType,
  ParentInputType,
  ParentOutputType,
  ParentStateType,
} from '../../base/state';
import { compositeDisabledStateSchema } from '../composite-disabled/composite-disabled-state';
import { compositeFocusStateSchema } from '../composite-focus/composite-focus-state';
import { listNavigationStateSchema } from '../list-navigation/list-navigation-state';
import { selectionStateSchema } from '../selection/selection-state';
import { typeaheadStateSchema } from '../typeahead/typeahead-state';

export type ListboxStateSchema<T> = ReturnType<typeof listboxStateSchema<T>>;

export type ListboxInputs<T> = ParentInputType<ListboxStateSchema<T>>;

export type ListboxOptionInputs<T> = ItemInputType<ListboxStateSchema<T>>;

export type ListboxOutputs<T> = ParentOutputType<ListboxStateSchema<T>>;

export type ListboxOptionOutputs<T> = ItemOutputType<ListboxStateSchema<T>>;

export type ListboxState<T> = ParentStateType<ListboxStateSchema<T>>;

export type ListboxOptionState<T> = ItemStateType<ListboxStateSchema<T>>;

export function listboxStateSchema<T>() {
  return composeSchema(
    composeSchema(
      compositeDisabledStateSchema(),
      composeSchema(
        composeSchema(listNavigationStateSchema(), typeaheadStateSchema()),
        compositeFocusStateSchema(),
      ),
    ),
    selectionStateSchema<T>(),
  );
}

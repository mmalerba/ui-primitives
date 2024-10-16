import {
  GetParentPropsArgs,
  ParentProps,
  SelectionStrategy,
} from '../types';
import { getChildProps } from '../shared';
import { linkedSignal } from '../../../../base/linked-signal';

export const IndependentFocus: SelectionStrategy = {
  getParentProps,
  getChildProps,
};

function getParentProps({ children: items }: GetParentPropsArgs): ParentProps {
  const selectedIndices = linkedSignal<unknown[], number[]>({
    source: items,
    computation: (items, prev) => {
      if (prev) {
        return prev.value.filter(i => i <= items.length);
      }
      return [];
    },
  });

  if (selectedIndices().length > 1) {
    throw Error('A multiselectable listbox cannot use selection follow focus');
  }

  return { selectedIndices };
}

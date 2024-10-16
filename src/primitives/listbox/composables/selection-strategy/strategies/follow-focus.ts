import { GetParentPropsArgs, ParentProps, SelectionStrategy } from '../types';
import { getChildProps } from '../shared';
import { linkedSignal } from '../../../../base/linked-signal';

export const FollowFocus: SelectionStrategy = {
  getParentProps,
  getChildProps,
};

function getParentProps({ activeIndex }: GetParentPropsArgs): ParentProps {
  const selectedIndices = linkedSignal({
    source: activeIndex,
    computation: (item) => [item],
  });

  if (selectedIndices().length > 1) {
    throw Error('A multiselectable listbox cannot use selection follow focus');
  }

  return { selectedIndices };
}

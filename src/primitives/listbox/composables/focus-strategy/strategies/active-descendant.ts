import { computed } from '@angular/core';
import { FocusStrategy, GetChildPropsArgs, GetParentPropsArgs, ChildProps, ParentProps } from '../types';
import { linkedSignal } from '../../../../base/linked-signal';

export const ActiveDescendant: FocusStrategy = {
  getParentProps,
  getChildProps,
};

function getParentProps({ children, selectedIndices }: GetParentPropsArgs): ParentProps {
  const activeIndex = linkedSignal<unknown[], number>({
    source: children, 
    computation: (children, prev) => {
      if (prev === undefined) {
        return selectedIndices().sort().reverse().pop() ?? -1;
      }
      if (!children[prev.value]) {
        return children.length - 1;
      }
      return prev.value;
    }
  });

  return {
    activeIndex,
    tabindex: computed(() => 0),
    activeId: computed(() => children().find((i) => i.active())?.id() ?? ''),
  };
}

function getChildProps({ index, activeIndex }: GetChildPropsArgs): ChildProps {
  const tabindex = computed(() => -1);
  const active = computed(() => index() === activeIndex());
  return { active, tabindex };
}

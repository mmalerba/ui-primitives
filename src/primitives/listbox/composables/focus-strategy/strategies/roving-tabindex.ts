import { computed } from '@angular/core';
import { FocusStrategy, GetChildPropsArgs, GetParentPropsArgs, ChildProps, ParentProps } from '../types';
import { linkedSignal } from '../../../../base/linked-signal';

export const RovingTabindex: FocusStrategy = {
  getParentProps,
  getChildProps,
};

function getParentProps({ children, selectedIndices }: GetParentPropsArgs): ParentProps {
  const activeIndex = linkedSignal<unknown[], number>({
    source: children, 
    computation: (children, prev) => {
      if (prev === undefined) {
        return selectedIndices().sort().reverse().pop() ?? 0;
      }
      if (!children[prev.value]) {
        return children.length - 1;
      }
      return prev.value;
    }
  });

  return {
    activeIndex,
    activeId: computed(() => ''),
    tabindex: computed(() => -1),
  };
}

function getChildProps({ index, disabled, activeIndex, selectedIndices }: GetChildPropsArgs): ChildProps {
  const active = computed(() => index() === activeIndex());
  const tabindex = computed(() => {
    if (!active()) {
      return -1;
    }

    if (disabled()) {
      return selectedIndices().includes(index()) ? 0 : -1;
    }

    return 0;
  });
  return { active, tabindex };
}

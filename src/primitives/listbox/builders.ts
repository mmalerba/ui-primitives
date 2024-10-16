import { computed, Signal, signal, WritableSignal } from '@angular/core';
import { Listbox, ListboxOption, ListboxState } from './interfaces';
import { ActiveDescendant, RovingTabindex } from './composables/focus-strategy';
import { FollowFocus } from './composables/selection-strategy/strategies/follow-focus';
import { IndependentFocus } from './composables/selection-strategy/strategies/independent-focus';

interface ListboxProps {
  wrap?: Signal<boolean>;
  multi?: Signal<boolean>;
  rovingFocus?: Signal<boolean>;
  followFocus?: Signal<boolean>;
  activeIndex?: Signal<number>;
  selectedIndices?: Signal<number[]>;
}

interface ListboxOptionProps {
  focus?: () => void;
  disabled?: Signal<boolean>;
}

export function createListbox(
  options: Signal<ListboxOption[]>,
  opts?: ListboxProps
): Listbox {
  const wrap = opts?.wrap ?? signal(true);
  const multi = opts?.multi ?? signal(false);

  const rovingFocus = opts?.rovingFocus ?? signal(true);
  const followFocus = opts?.followFocus ?? signal(true);
  const selectedIndices = opts?.selectedIndices ?? signal([]);

  const focusStrategy = opts?.rovingFocus
    ? RovingTabindex.getParentProps({ children: options, selectedIndices })
    : ActiveDescendant.getParentProps({ children: options, selectedIndices });

  const selectionStrategy = opts?.followFocus
    ? FollowFocus.getParentProps({ children: options, activeIndex: focusStrategy.activeIndex })
    : IndependentFocus.getParentProps({ children: options, activeIndex: focusStrategy.activeIndex });

  return {
    wrap,
    multi,
    options,
    rovingFocus,
    followFocus,
    activeId: focusStrategy.activeId,
    tabindex: focusStrategy.tabindex,
    state: {
      activeIndex: focusStrategy.activeIndex,
      selectedIndices: selectionStrategy.selectedIndices,
    },
  };
}

let counter = 0;

export function createListboxOption(listbox: Listbox, opts?: ListboxOptionProps): ListboxOption {
  const focus = opts?.focus || (() => {});
  const disabled = opts?.disabled || signal(false);

  const option: Partial<ListboxOption> = {};
  const index = computed(() => listbox.options().indexOf(option as ListboxOption));

  const focusStrategy = listbox.rovingFocus()
    ? RovingTabindex.getChildProps({ index, disabled, ...listbox.state })
    : ActiveDescendant.getChildProps({ index, disabled, ...listbox.state });

  const selectionStrategy = listbox.followFocus()
    ? FollowFocus.getChildProps({ index, ...listbox.state })
    : IndependentFocus.getChildProps({ index, ...listbox.state });

  return {
    focus,
    index,
    disabled,
    active: focusStrategy.active,
    tabindex: focusStrategy.tabindex,
    selected: selectionStrategy.selected,
    id: signal(`${counter++}`),
  }
}

import { getNextOption, getPrevOption } from './composables/list';
import { Listbox, ListboxState } from './interfaces';

export function onKeyDown(event: KeyboardEvent, listbox: Listbox) {
  switch (event.key) {
    case 'ArrowDown':
      return onArrowDown(listbox);
    case 'ArrowUp':
      return onArrowUp(listbox);
    default:
      return listbox.state;
  }
}

function onArrowUp(listbox: Listbox): ListboxState {
  return {
    activeIndex: getPrevOption(listbox).index(),
    selectedIndex: state.selectedIndex,
  }
}

function onArrowDown(listbox: Listbox): ListboxState {
  const state = listbox.state();
  return {
    activeIndex: getNextOption(listbox, state).index(),
    selectedIndex: state.selectedIndex,
  }
}

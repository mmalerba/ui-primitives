import { Listbox, ListboxState } from "./interfaces";
import { onKeyDown } from "./key-handlers";

export function updateState(listbox: Listbox, newState: ListboxState) {
  const oldState = listbox.state;

  if (oldState.activeIndex !== newState.activeIndex && listbox.rovingFocus()) {
    listbox.options()[newState.activeIndex()]?.focus();
  }

  listbox.state.activeIndex.set(newState.activeIndex());
  listbox.state.selectedIndex.set(newState.selectedIndex());
}

export function handleKeyDown(event: KeyboardEvent, listbox: Listbox) {
  updateState(listbox, onKeyDown(event, listbox));
}
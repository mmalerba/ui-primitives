import { Signal, WritableSignal } from "@angular/core";

export interface Listbox {
  wrap: Signal<boolean>;
  options: Signal<ListboxOption[]>;
  multi: Signal<boolean>;
  followFocus: Signal<boolean>;
  rovingFocus: Signal<boolean>;
  activeId: Signal<string | undefined>;
  tabindex: Signal<number>;
  state: ListboxState;
}

export interface ListboxOption {
  id: Signal<string>;
  index: Signal<number>;
  active: Signal<boolean>;
  selected: Signal<boolean>;
  disabled: Signal<boolean>;
  tabindex: Signal<number>;
  focus: () => void;
}

export interface ListboxState {
  activeIndex: WritableSignal<number>;
  selectedIndices: WritableSignal<number[]>;
}

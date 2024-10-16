import { Signal, WritableSignal } from '@angular/core';

export interface FocusStrategy {
  getParentProps: (args: GetParentPropsArgs) => ParentProps;
  getChildProps: (args: GetChildPropsArgs) => ChildProps;
}

interface Child {
  id: Signal<string>;
  index: Signal<number>;
  active: Signal<boolean>;
}

export interface GetChildPropsArgs {
  index: Signal<number>;
  disabled: Signal<boolean>;
  activeIndex: Signal<number>;
  selectedIndices: Signal<number[]>;
}

export interface GetParentPropsArgs {
  children: Signal<Child[]>;
  selectedIndices: Signal<number[]>;
}

export interface ParentProps {
  activeId: Signal<string>;
  tabindex: Signal<number>;
  activeIndex: WritableSignal<number>;
}

export interface ChildProps {
  active: Signal<boolean>;
  tabindex: Signal<number>;
}

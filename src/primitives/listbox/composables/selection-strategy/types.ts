import { Signal, WritableSignal } from '@angular/core';

export interface SelectionStrategy {
  getParentProps: (args: GetParentPropsArgs) => ParentProps;
  getChildProps: (args: GetChildPropsArgs) => ChildProps;
}

interface Child {
  id: Signal<string>;
  index: Signal<number>;
  selected: Signal<boolean>;
}

export interface GetChildPropsArgs {
  index: Signal<number>;
  selectedIndices: Signal<number[]>;
}

export interface GetParentPropsArgs {
  children: Signal<Child[]>;
  activeIndex: Signal<number>;
}

export interface ParentProps {
  selectedIndices: WritableSignal<number[]>;
}

export interface ChildProps {
  selected: Signal<boolean>;
}

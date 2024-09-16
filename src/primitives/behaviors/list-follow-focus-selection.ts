import { computed, Signal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { BehaviorEventTarget } from '../base/event-dispatcher';
import { ExtendableState } from '../base/extendable-state';

export type ListFollowFocusSelectionItemState<T> = ExtendableState<{
  readonly identity: T;

  readonly disabled?: Signal<boolean>;
}>;

export type ListFollowFocusSelectionState<T> = ExtendableState<{
  readonly element: HTMLElement;

  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly selected: Signal<T | undefined>;
  readonly items: Signal<readonly ListFollowFocusSelectionItemState<T>[]>;
  readonly activated: Signal<T | undefined>;
  readonly disabled: Signal<boolean>;
}>;

export class ListFollowFocusSelectionBehavior<T> extends Behavior<
  ListFollowFocusSelectionState<T>
> {
  private readonly activated = this.state.activated.extend(this, (value) => value);

  private readonly selectedItem = computed(() =>
    this.state.items().find((item) => item.identity === this.state.selected())
  );

  constructor(state: ListFollowFocusSelectionState<T>) {
    super(state);

    state.selected.extend(this, (selected) => state.activated() ?? selected);

    state.disabled.extend(this, (disabled) => disabled || !!this.selectedItem()?.disabled?.());

    this.listeners.push(state.focusinEvents.listen(() => this.handleFocusin()));
  }

  private handleFocusin() {
    if (this.state.disabled?.()) {
      return;
    }
    this.activated.set(this.state.selected());
  }
}

import { computed, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { hasFocus } from '../base/dom';
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
  readonly active: Signal<T | undefined>;
  readonly disabled: Signal<boolean>;
}>;

export class ListFollowFocusSelectionBehavior<T> extends Behavior<
  ListFollowFocusSelectionState<T>
> {
  private disabled: WritableSignal<boolean>;

  private readonly activeItem = computed(() =>
    this.state.items().find((item) => item.identity === this.state.active())
  );

  private readonly selected = this.state.selected.extend(this, (selected) => {
    const selectedItem = this.state.items().find((item) => item.identity === selected);
    const canSelect = !(
      this.disabled() ||
      selectedItem?.disabled?.() ||
      this.activeItem()?.disabled?.()
    );
    return canSelect && hasFocus(this.state.element) ? this.state.active() : selected;
  });

  private readonly selectedItem = computed(() =>
    this.state.items().find((item) => item.identity === this.state.selected())
  );

  constructor(state: ListFollowFocusSelectionState<T>) {
    super(state);

    this.disabled = this.state.disabled.extend(this, (disabled) => disabled);

    state.disabled.extend(this, (disabled) => {
      return disabled || this.selectedItem()?.disabled?.() || false;
    });

    this.listeners.push(state.focusinEvents.listen(() => this.handleFocusin()));
  }

  private handleFocusin() {
    if (this.state.disabled?.()) {
      return;
    }
    this.selected.set(this.state.active());
  }
}

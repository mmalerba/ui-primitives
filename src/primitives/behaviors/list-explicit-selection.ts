import { computed, Signal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { BehaviorEventTarget } from '../base/event-dispatcher';
import { ExtendableState } from '../base/extendable-state';

export type ListExplicitSelectionItemState<T> = ExtendableState<{
  readonly identity: T;

  readonly disabled?: Signal<boolean>;
}>;

export type ListExplicitSelectionState<T> = ExtendableState<{
  readonly element: HTMLElement;

  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;
  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly selected: Signal<T | undefined>;
  readonly items: Signal<readonly ListExplicitSelectionItemState<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly disabled: Signal<boolean>;
}>;

export class ListExplicitSelectionBehavior<T> extends Behavior<ListExplicitSelectionState<T>> {
  private selectedItem = computed(() =>
    this.state.items().find((item) => item.identity === this.state.selected())
  );

  private activeItem = computed(() =>
    this.state.items().find((item) => item.identity === this.state.active())
  );

  private canSelectActiveItem = computed(
    () =>
      !(
        this.state.disabled?.() ||
        this.selectedItem()?.disabled?.() ||
        this.activeItem()?.disabled?.()
      )
  );

  private selected = this.state.selected.extend(
    this,
    (selected) => this.state.items().find((item) => item.identity === selected)?.identity
  );

  constructor(state: ListExplicitSelectionState<T>) {
    super(state);

    state.disabled.extend(this, (disabled) => {
      return disabled || this.selectedItem()?.disabled?.() || false;
    });

    this.listeners.push(state.keydownEvents.listen((event) => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.state.disabled?.()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (this.canSelectActiveItem()) {
          this.selected.set(this.state.active());
        }
        break;
    }
  }
}

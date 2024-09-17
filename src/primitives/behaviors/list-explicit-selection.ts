import { computed, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { EventDispatcher } from '../base/event-dispatcher';
import { PatchableSignal } from '../base/patchable-signal';

export interface ListExplicitSelectionItemState<I> {
  readonly identity: I;

  readonly disabled?: Signal<boolean>;
}

export type ListExplicitSelectionState<T> = T extends ListExplicitSelectionItemState<infer I>
  ? {
      readonly element: HTMLElement;

      readonly keydownEvents: EventDispatcher<KeyboardEvent>;

      readonly selected: PatchableSignal<I | undefined>;
      readonly disabled: PatchableSignal<boolean>;

      readonly items: Signal<T[]>;
      readonly active: Signal<I | undefined>;
    }
  : never;

export class ListExplicitSelectionBehavior<T> extends Behavior<ListExplicitSelectionState<T>> {
  init() {
    const selectedItem = computed(() =>
      this.state.items().find((item) => item.identity === this.state.selected())
    );

    const activeItem = computed(() =>
      this.state.items().find((item) => item.identity === this.state.active())
    );

    const canSelectActiveItem = computed(
      () => !(this.state.disabled?.() || selectedItem()?.disabled?.() || activeItem()?.disabled?.())
    );

    const selected = this.state.selected.patch((selected) => selected, {
      connected: this.connected,
    });

    this.state.disabled.patch((disabled) => disabled || !!selectedItem()?.disabled?.(), {
      connected: this.connected,
    });

    this.state.keydownEvents
      .target(this.connected)
      .listen((event) => this.handleKeydown(event, canSelectActiveItem, selected));
  }

  private handleKeydown(
    event: KeyboardEvent,
    canSelectActiveItem: Signal<boolean>,
    selected: WritableSignal<unknown>
  ) {
    if (this.state.disabled?.()) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (canSelectActiveItem()) {
          selected.set(this.state.active());
        }
        break;
    }
  }
}

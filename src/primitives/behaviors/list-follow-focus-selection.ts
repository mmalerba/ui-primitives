import { computed, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { EventDispatcher } from '../base/event-dispatcher';
import { PatchableSignal } from '../base/patchable-signal';

export type ListFollowFocusSelectionItemState<I> = {
  readonly identity: I;

  readonly disabled?: Signal<boolean>;
};

export type ListFollowFocusSelectionState<T> = T extends ListFollowFocusSelectionItemState<infer I>
  ? {
      readonly element: HTMLElement;

      readonly focusinEvents: EventDispatcher<FocusEvent>;

      readonly activated: PatchableSignal<I | undefined>;
      readonly selected: PatchableSignal<I | undefined>;
      readonly disabled: PatchableSignal<boolean>;

      readonly items: Signal<T[]>;
    }
  : never;

export class ListFollowFocusSelectionBehavior<T> extends Behavior<
  ListFollowFocusSelectionState<T>
> {
  init() {
    const selectedItem = computed(() =>
      this.state.items().find((item) => item.identity === this.state.selected())
    );

    const activated = this.state.activated.patch((value) => value, {
      connected: this.connected,
    });

    this.state.selected.patch((selected) => this.state.activated() ?? selected, {
      connected: this.connected,
    });

    this.state.disabled.patch((disabled) => disabled || !!selectedItem()?.disabled?.(), {
      connected: this.connected,
    });

    this.state.focusinEvents.target(this.connected).listen(() => this.handleFocusin(activated));
  }

  private handleFocusin(activated: WritableSignal<unknown>) {
    if (this.state.disabled?.()) {
      return;
    }
    activated.set(this.state.selected());
  }
}

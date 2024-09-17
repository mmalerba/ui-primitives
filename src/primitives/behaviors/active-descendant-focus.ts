import { computed, Signal, untracked, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { hasFocus } from '../base/dom';
import { EventDispatcher } from '../base/event-dispatcher';
import { PatchableSignal } from '../base/patchable-signal';
import { withPrevious } from '../base/with-previous';

export interface ActiveDescendantFocusItemState<I> {
  readonly identity: I;

  readonly tabindex: PatchableSignal<number | undefined>;

  readonly id: Signal<string>;
  readonly disabled?: Signal<boolean>;
}

export type ActiveDescendantFocusState<T> = T extends ActiveDescendantFocusItemState<infer I>
  ? {
      readonly element: HTMLElement;

      readonly focusinEvents: EventDispatcher<FocusEvent>;

      readonly items: PatchableSignal<T[]>;
      readonly tabindex: PatchableSignal<number | undefined>;
      readonly activeDescendantId: PatchableSignal<string | undefined>;
      readonly focused: PatchableSignal<{ element: HTMLElement } | undefined>;

      readonly active: Signal<I | undefined>;
      readonly disabled?: Signal<boolean>;
    }
  : never;

export class ActiveDescendantFocusBehavior<T> extends Behavior<ActiveDescendantFocusState<T>> {
  init() {
    const focused = this.state.focused.patch(
      (focused) =>
        !this.state.disabled?.() && hasFocus(this.state.element)
          ? { element: this.state.element }
          : focused,
      { connected: this.connected }
    );

    const activeItem = computed(() =>
      this.state.items().find((i) => i.identity === this.state.active())
    );

    this.state.activeDescendantId.patch(() => activeItem()?.id(), { connected: this.connected });

    this.state.tabindex.patch(() => (this.state.disabled?.() ? -1 : 0), {
      connected: this.connected,
    });

    this.state.items.patch(
      withPrevious((previous, items) => {
        const previousIdentities = new Set(previous?.map((i) => i.identity) ?? []);
        for (const item of items) {
          if (!previousIdentities.has(item.identity)) {
            untracked(() => item.tabindex.patch(() => -1, { connected: this.connected }));
          }
        }
        return items;
      }),
      { connected: this.connected }
    );

    this.state.focusinEvents.target(this.connected).listen(() => this.handleFocusin(focused));
  }

  private handleFocusin(focused: WritableSignal<{ element: HTMLElement } | undefined>) {
    if (this.state.disabled?.()) {
      return;
    }
    focused.set({ element: this.state.element });
  }
}

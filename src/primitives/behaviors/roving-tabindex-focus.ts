import { computed, Signal, untracked, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { hasFocus } from '../base/dom';
import { EventDispatcher } from '../base/event-dispatcher';
import { PatchableSignal } from '../base/patchable-signal';
import { withPrevious } from '../base/with-previous';

export interface RovingTabindexFocusItemState<I> {
  readonly identity: I;
  readonly element: HTMLElement;

  readonly tabindex: PatchableSignal<number | undefined>;

  readonly disabled?: Signal<boolean>;
}

export type RovingTabindexFocusState<T> = T extends RovingTabindexFocusItemState<infer I>
  ? {
      readonly element: HTMLElement;

      readonly focusinEvents: EventDispatcher<FocusEvent>;
      readonly focusoutEvents: EventDispatcher<FocusEvent>;

      readonly items: PatchableSignal<T[]>;
      readonly focused: PatchableSignal<{ element: HTMLElement } | undefined>;
      readonly active: PatchableSignal<I | undefined>;
      readonly tabindex: PatchableSignal<number | undefined>;
      readonly activeDescendantId: PatchableSignal<string | undefined>;

      readonly disabled?: Signal<boolean>;
    }
  : never;

export class RovingTabindexFocusBehavior<T> extends Behavior<RovingTabindexFocusState<T>> {
  init() {
    const activeItem = computed(() =>
      this.state.items().find((i) => i.identity === this.state.active())
    );

    const focused = this.state.focused.patch(
      (focused) => {
        const element = activeItem()?.element;
        return hasFocus(this.state.element) ? element && { element } : focused;
      },
      { connected: this.connected }
    );

    this.state.active.patch(
      (active) => {
        const activeItem = this.state.items().find((i) => i.identity === active);
        return !activeItem || activeItem.disabled?.()
          ? this.getFirstActivatableItem()?.identity
          : activeItem?.identity;
      },
      { connected: this.connected }
    );

    this.state.tabindex.patch(() => -1, { connected: this.connected });

    this.state.activeDescendantId.patch(() => undefined, { connected: this.connected });

    this.state.items.patch(
      withPrevious((previous, items) => {
        const previousIdentities = new Set(previous?.map((i) => i.identity) ?? []);
        for (const item of items) {
          if (!previousIdentities.has(item.identity)) {
            untracked(() =>
              item.tabindex.patch(
                () => (!this.state.disabled?.() && item.identity === this.state.active() ? 0 : -1),
                {
                  connected: this.connected,
                }
              )
            );
          }
        }
        return items;
      }),
      { connected: this.connected }
    );

    this.state.focusinEvents
      .target(this.connected)
      .listen(() => this.handleFocusin(activeItem, focused));
    this.state.focusoutEvents.target(this.connected).listen((e) => this.handleFocusout(e, focused));
  }

  private getFirstActivatableItem() {
    for (const item of this.state.items()) {
      if (!item.disabled?.()) {
        return item;
      }
    }
    return undefined;
  }

  private handleFocusin(
    activeItem: Signal<RovingTabindexFocusItemState<unknown> | undefined>,
    focused: WritableSignal<{ element: HTMLElement } | undefined>
  ) {
    if (this.state.disabled?.()) {
      return;
    }
    const element = activeItem()?.element;
    focused.set(element && { element });
  }

  private handleFocusout(
    e: FocusEvent,
    focused: WritableSignal<{ element: HTMLElement } | undefined>
  ) {
    const targetRemoved = !this.state.items().some((item) => item.element === e.target);
    if (targetRemoved) {
      const element = this.getFirstActivatableItem()?.element;
      focused.set(element && { element });
    }
  }
}

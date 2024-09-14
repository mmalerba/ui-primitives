import { computed, Signal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { hasFocus } from '../base/dom';
import { BehaviorEventTarget } from '../base/event-dispatcher';
import { createExtendableState, ExtendableState } from '../base/extendable-state';

export type RovingTabindexFocusItemState<T> = ExtendableState<{
  readonly identity: T;
  readonly element: HTMLElement;

  readonly tabindex: Signal<number | undefined>;

  readonly disabled?: Signal<boolean>;
}>;

export type RovingTabindexFocusState<T> = ExtendableState<{
  readonly element: HTMLElement;

  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;
  readonly focusoutEvents: BehaviorEventTarget<FocusEvent>;

  readonly items: Signal<readonly RovingTabindexFocusItemState<T>[]>;
  readonly active: Signal<T | undefined>;
  readonly tabindex: Signal<number | undefined>;
  readonly focused: Signal<HTMLElement | undefined>;
  readonly activeDescendantId: Signal<string | undefined>;

  readonly disabled?: Signal<boolean>;
}>;

export class RovingTabindexFocusBehavior<T> extends Behavior<RovingTabindexFocusState<T>> {
  private activeItem = computed(() =>
    this.state.items().find((i) => i.identity === this.state.active())
  );

  private focused = this.state.focused.extend(this, (focused) =>
    hasFocus(this.state.element) ? this.activeItem()?.element : focused
  );

  constructor(state: RovingTabindexFocusState<T>) {
    super(state);

    state.active.extend(this, (active) => {
      if (state.disabled?.()) {
        return active;
      }
      const activeItem = state.items().find((i) => i.identity === active);
      return activeItem?.disabled?.()
        ? this.getFirstActivatableItem()?.identity
        : activeItem?.identity;
    });

    state.tabindex.extend(this, () => -1);

    state.activeDescendantId.extend(this, () => undefined);

    state.items.extend(this, (items) =>
      items.map((item) =>
        createExtendableState({
          ...item,
          tabindex: item.tabindex.extend(this, () => (item.identity === state.active() ? 0 : -1)),
        })
      )
    );

    this.listeners.push(
      state.focusinEvents.listen(() => this.handleFocusin()),
      state.focusoutEvents.listen((e) => this.handleFocusout(e))
    );
  }

  private getFirstActivatableItem() {
    if (this.state.disabled?.()) {
      return undefined;
    }
    for (const item of this.state.items()) {
      if (!item.disabled?.()) {
        return item;
      }
    }
    return undefined;
  }

  private handleFocusin() {
    if (this.state.disabled?.()) {
      return;
    }
    this.focused.set(this.activeItem()?.element);
  }

  private handleFocusout(e: FocusEvent) {
    const targetRemoved = !this.state.items().some((item) => item.element === e.target);
    if (targetRemoved) {
      this.focused.set(this.getFirstActivatableItem()?.element);
    }
  }
}

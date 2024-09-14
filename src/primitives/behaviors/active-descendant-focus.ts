import { computed, Signal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { hasFocus } from '../base/dom';
import { BehaviorEventTarget } from '../base/event-dispatcher';
import { createExtendableState, ExtendableState } from '../base/extendable-state';

export type ActiveDescendantFocusItemState<T> = ExtendableState<{
  readonly identity: T;

  readonly id: Signal<string>;
  readonly tabindex: Signal<number | undefined>;
  readonly disabled?: Signal<boolean>;
}>;

export type ActiveDescendantFocusState<T> = ExtendableState<{
  readonly element: HTMLElement;

  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly items: Signal<ActiveDescendantFocusItemState<T>[]>;
  readonly tabindex: Signal<number | undefined>;
  readonly active: Signal<T | undefined>;
  readonly activeDescendantId: Signal<string | undefined>;
  readonly focused: Signal<HTMLElement | undefined>;
  readonly disabled?: Signal<boolean>;
}>;

export class ActiveDescendantFocusBehavior<T> extends Behavior<ActiveDescendantFocusState<T>> {
  private readonly focused = this.state.focused.extend(this, (focused) =>
    !this.state.disabled?.() && hasFocus(this.state.element) ? this.state.element : focused
  );

  constructor(state: ActiveDescendantFocusState<T>) {
    super(state);

    state.active.extend(this, (active) => {
      const item = state.items().find((i) => i.identity === active);
      return item?.disabled?.() ? undefined : item?.identity;
    });

    const activeItem = computed(() => {
      console.log('active', state.active());
      return state.items().find((i) => i.identity === state.active());
    });

    state.activeDescendantId.extend(this, () => activeItem()?.id());

    state.tabindex.extend(this, () => (state.disabled?.() ? -1 : 0));

    state.items.extend(this, (items) =>
      items.map((item) =>
        createExtendableState({
          ...item,
          tabindex: item.tabindex.extend(this, () => -1),
        })
      )
    );

    this.listeners.push(state.focusinEvents.listen(() => this.handleFocusin()));
  }

  private handleFocusin() {
    if (this.state.disabled?.()) {
      return;
    }
    this.focused.set(this.state.element);
  }
}

import { computed, signal, Signal, untracked } from '@angular/core';
import { Behavior, BehaviorEventTarget, hasFocus, UiState } from './base';

export interface ActiveDescendantFocusItemState<T> extends UiState {
  readonly identity: T;

  readonly id: Signal<string>;
  readonly disabled?: Signal<boolean>;

  tabindex: Signal<number | undefined>;
}

export interface ActiveDescendantFocusState<T> extends UiState {
  readonly element: HTMLElement;

  readonly focusinEvents: BehaviorEventTarget<FocusEvent>;

  readonly items: Signal<ActiveDescendantFocusItemState<T>[]>;
  readonly disabled?: Signal<boolean>;

  tabindex: Signal<number | undefined>;
  active: Signal<T | undefined>;
  activeDescendantId: Signal<string | undefined>;
  focused: Signal<HTMLElement | undefined>;
}

export class ActiveDescendantFocusBehavior<T> extends Behavior<ActiveDescendantFocusState<T>> {
  private readonly activeItem = computed(() => {
    const activeItem = this.uiState
      .items()
      .find((item) => item.identity === untracked(() => this.uiState.active()));
    return this.uiState.disabled?.() || activeItem?.disabled?.() ? undefined : activeItem;
  });

  private readonly active = computed(() => {
    if (this.uiState.disabled?.()) return untracked(() => this.uiState.active());
    return this.activeItem()?.identity;
  });

  private readonly activeDescendantId = computed(() => {
    if (this.uiState.disabled?.()) return this.uiState.activeDescendantId();
    return this.activeItem()?.id();
  });

  private readonly tabindex = computed(() => (this.uiState.disabled?.() ? -1 : 0));

  private readonly focused = signal(
    !this.uiState.disabled?.() && hasFocus(this.uiState.element)
      ? this.uiState.element
      : this.uiState.focused()
  );

  constructor(uiState: ActiveDescendantFocusState<T>) {
    super(uiState);

    uiState.active = this.active;
    /*uiState.activeDescendantId = merge(uiState.activeDescendantId, this.activeDescendantId);
    uiState.tabindex = merge(uiState.tabindex, this.tabindex);
    uiState.focused = merge(uiState.focused, this.focused);*/

    // TODO: this will probably miss new items...
    /*for (const itemUiState of this.uiState.items()) {
      itemUiState.tabindex = signal(-1);
    }*/

    this.listeners.push(this.uiState.focusinEvents.listen(() => this.handleFocusin()));
  }

  private handleFocusin() {
    if (this.uiState.disabled?.()) {
      return;
    }
    this.focused.set(this.uiState.element);
  }
}

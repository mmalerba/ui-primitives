import { computed, signal, Signal, untracked } from '@angular/core';
import { Behavior, BehaviorEventTarget, UiState } from './base';

export interface ListNavigationItemState<T> extends UiState {
  readonly identity: T;

  readonly disabled?: Signal<boolean>;
}

export interface ListNavigationState<T> extends UiState {
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly items: Signal<readonly ListNavigationItemState<T>[]>;
  readonly disabled?: Signal<boolean>;
  readonly orientation?: Signal<'vertical' | 'horizontal'>;
  readonly direction?: Signal<'ltr' | 'rtl'>;

  active: Signal<T | undefined>;
}

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export const DEFAULT_LIST_KEY_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export class ListNavigationBehavior<T> extends Behavior<ListNavigationState<T>> {
  private readonly options: ListNavigationOptions;

  private readonly active = signal(this.uiState.active());

  private readonly activeIndex = computed(() => {
    return this.uiState.items().findIndex((i) => i.identity === untracked(() => this.active()));
  });

  constructor(uiState: ListNavigationState<T>, options?: Partial<ListNavigationOptions>) {
    super(uiState);

    this.options = { ...DEFAULT_LIST_KEY_NAVIGATION_OPTIONS, ...options };
    uiState.active = this.active;
    this.listeners.push(uiState.keydownEvents.listen((event) => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    const orientation = this.uiState.orientation?.() ?? 'vertical';
    const direction = this.uiState.direction?.() ?? 'ltr';

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.activateNextItem();
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.activatePreviousItem();
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activateNextItem();
          } else {
            this.activatePreviousItem();
          }
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activatePreviousItem();
          } else {
            this.activateNextItem();
          }
          event.preventDefault();
        }
        break;
    }
  }

  private activateNextItem() {
    const currentIndex = this.activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex + 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex < this.uiState.items().length - 1)
    );
    if (this.canActivate(nextIndex)) {
      this.active.set(this.uiState.items()[nextIndex].identity);
    }
  }

  private activatePreviousItem() {
    const currentIndex = this.activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex - 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex > 0)
    );
    if (this.canActivate(nextIndex)) {
      this.active.set(this.uiState.items()[nextIndex].identity);
    }
  }

  private clampIndex(index: number) {
    const itemCount = this.uiState.items().length;
    return this.options.wrap
      ? (index + itemCount) % itemCount
      : Math.min(Math.max(index, 0), itemCount - 1);
  }

  private canActivate(index: number) {
    if (this.uiState.disabled?.() || this.uiState.items()[index].disabled?.()) {
      return false;
    }
    return true;
  }
}

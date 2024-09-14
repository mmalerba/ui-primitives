import { computed, Signal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { BehaviorEventTarget } from '../base/event-dispatcher';
import { ExtendableState } from '../base/extendable-state';

export type ListNavigationItemState<T> = ExtendableState<{
  readonly identity: T;

  readonly disabled?: Signal<boolean>;
}>;

export type ListNavigationState<T> = ExtendableState<{
  readonly keydownEvents: BehaviorEventTarget<KeyboardEvent>;

  readonly items: Signal<readonly ListNavigationItemState<T>[]>;
  readonly active: Signal<T | undefined>;

  readonly disabled?: Signal<boolean>;
  readonly orientation?: Signal<'vertical' | 'horizontal'>;
  readonly direction?: Signal<'ltr' | 'rtl'>;
}>;

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export const DEFAULT_LIST_KEY_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export class ListNavigationBehavior<T> extends Behavior<ListNavigationState<T>> {
  private readonly options: ListNavigationOptions;

  private readonly active = this.state.active.extend(this, (value) => value);

  private readonly activeIndex = computed(() =>
    this.state.items().findIndex((i) => i.identity === this.active())
  );

  constructor(state: ListNavigationState<T>, options?: Partial<ListNavigationOptions>) {
    super(state);

    this.options = { ...DEFAULT_LIST_KEY_NAVIGATION_OPTIONS, ...options };
    this.listeners.push(state.keydownEvents.listen((event) => this.handleKeydown(event)));
  }

  private handleKeydown(event: KeyboardEvent) {
    const orientation = this.state.orientation?.() ?? 'vertical';
    const direction = this.state.direction?.() ?? 'ltr';

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
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex < this.state.items().length - 1)
    );
    if (this.canActivate(nextIndex)) {
      this.active.set(this.state.items()[nextIndex].identity);
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
      this.active.set(this.state.items()[nextIndex].identity);
    }
  }

  private clampIndex(index: number) {
    const itemCount = this.state.items().length;
    return this.options.wrap
      ? (index + itemCount) % itemCount
      : Math.min(Math.max(index, 0), itemCount - 1);
  }

  private canActivate(index: number) {
    if (this.state.disabled?.() || this.state.items()[index].disabled?.()) {
      return false;
    }
    return true;
  }
}

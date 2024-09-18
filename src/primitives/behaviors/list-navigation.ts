import { computed, Signal, WritableSignal } from '@angular/core';
import { Behavior } from '../base/behavior';
import { EventDispatcher } from '../base/event-dispatcher';
import { PatchableSignal } from '../base/patchable-signal';

export interface ListNavigationItemState<I> {
  readonly identity: I;

  readonly disabled?: Signal<boolean>;
}

export type ListNavigationState<T> = T extends ListNavigationItemState<infer I>
  ? {
      readonly keydownEvents: EventDispatcher<KeyboardEvent>;

      readonly active: PatchableSignal<I | undefined>;
      readonly activated: PatchableSignal<I | undefined>;

      readonly items: Signal<readonly T[]>;
      readonly disabled?: Signal<boolean>;
      readonly orientation?: Signal<'vertical' | 'horizontal'>;
      readonly direction?: Signal<'ltr' | 'rtl'>;
    }
  : never;

export interface ListNavigationOptions {
  readonly wrap: boolean;
}

export const DEFAULT_LIST_KEY_NAVIGATION_OPTIONS: ListNavigationOptions = {
  wrap: false,
};

export class ListNavigationBehavior<T> extends Behavior<ListNavigationState<T>> {
  private readonly options: ListNavigationOptions;

  constructor(state: ListNavigationState<T>, options?: Partial<ListNavigationOptions>) {
    super(state);
    this.options = { ...DEFAULT_LIST_KEY_NAVIGATION_OPTIONS, ...options };
  }

  init() {
    const activated = this.state.activated.patch((value) => value, {
      connected: this.connected,
    });

    const activeIndex = computed(() =>
      this.state.items().findIndex((i) => i.identity === this.state.active())
    );

    this.state.active.patch(
      (active) => {
        const item = this.state.items().find((item) => item.identity === (activated() ?? active));
        return item?.disabled?.() ? undefined : item?.identity;
      },
      { connected: this.connected }
    );

    this.state.keydownEvents
      .target(this.connected)
      .listen((event) => this.handleKeydown(event, activeIndex, activated));
  }

  private handleKeydown(
    event: KeyboardEvent,
    activeIndex: Signal<number>,
    activated: WritableSignal<unknown>
  ) {
    const orientation = this.state.orientation?.() ?? 'vertical';
    const direction = this.state.direction?.() ?? 'ltr';

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          this.activateNextItem(activeIndex, activated);
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          this.activatePreviousItem(activeIndex, activated);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activateNextItem(activeIndex, activated);
          } else {
            this.activatePreviousItem(activeIndex, activated);
          }
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          if (direction === 'ltr') {
            this.activatePreviousItem(activeIndex, activated);
          } else {
            this.activateNextItem(activeIndex, activated);
          }
          event.preventDefault();
        }
        break;
    }
  }

  private activateNextItem(activeIndex: Signal<number>, activated: WritableSignal<unknown>) {
    const currentIndex = activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex + 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex < this.state.items().length - 1)
    );
    if (this.canActivate(nextIndex)) {
      activated.set(this.state.items()[nextIndex].identity);
    }
  }

  private activatePreviousItem(activeIndex: Signal<number>, activated: WritableSignal<unknown>) {
    const currentIndex = activeIndex();
    let nextIndex = currentIndex;
    do {
      nextIndex = this.clampIndex(nextIndex - 1);
    } while (
      !this.canActivate(nextIndex) &&
      (this.options.wrap ? nextIndex !== currentIndex : nextIndex > 0)
    );
    if (this.canActivate(nextIndex)) {
      activated.set(this.state.items()[nextIndex].identity);
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

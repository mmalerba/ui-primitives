import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import {
  getIndex,
  getNextIndex,
  ListNavigationItemState,
  ListNavigationState,
} from './list-navigation-state';

export interface ListNavigationControllerOptions {
  arrowKeyModifiers: ModifierKey | ModifierKey[];
  homeEndKeyModifiers: ModifierKey | ModifierKey[];
  wrap: boolean;
}

const defaultOptions: ListNavigationControllerOptions = {
  arrowKeyModifiers: ModifierKey.None,
  homeEndKeyModifiers: ModifierKey.None,
  wrap: false,
};

export class ListNavigationController implements Controller {
  readonly handlers = {
    click: (e: MouseEvent) => this.clickManager.handle(e),
    keydown: (e: KeyboardEvent) => this.keydownManager().handle(e),
  } as const;

  readonly clickManager = new MouseEventManager().on(MouseButton.Main, (event) => {
    const index = this.items().findIndex((item) => item.element.contains(event.target as Node));
    this.navigateTo(index);
  });

  readonly keydownManager = computed(() => {
    const previousKey = this.list.orientation() === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = this.list.orientation() === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    return new KeyboardEventManager()
      .on(this.options().arrowKeyModifiers, previousKey, () => {
        this.navigatePrevious();
      })
      .on(this.options().arrowKeyModifiers, nextKey, () => {
        this.navigateNext();
      })
      .on(this.options().homeEndKeyModifiers, 'Home', () => {
        this.navigateFirst();
      })
      .on(this.options().homeEndKeyModifiers, 'End', () => {
        this.navigateLast();
      });
  });

  private options: Signal<ListNavigationControllerOptions>;

  constructor(
    private readonly list: ListNavigationState,
    private readonly items: Signal<readonly ListNavigationItemState[]>,
    options?: Signal<Partial<ListNavigationControllerOptions>>,
  ) {
    this.options = computed(() => ({ ...defaultOptions, ...options?.() }));
  }

  navigateTo(index: number): void {
    this.navigate(index, () => index);
  }

  navigatePrevious() {
    this.navigate(this.list.activeIndex(), this.getPreviousIndex);
  }

  navigateNext() {
    this.navigate(this.list.activeIndex(), this.getNextIndex);
  }

  navigateFirst() {
    this.navigate(-1, this.getNextIndex);
  }

  navigateLast() {
    this.navigate(-1, this.getPreviousIndex);
  }

  private getPreviousIndex = (index: number) => {
    index = index === -1 ? this.items().length : index;
    return this.options().wrap && index === 0 ? this.items().length - 1 : index - 1;
  };

  private getNextIndex = (index: number) => getNextIndex(this.items, index, this.options().wrap);

  private navigate(initial: number, navigateFn: (i: number) => number): void {
    const index = getIndex(this.items, initial, navigateFn);
    if (index !== -1) {
      this.list.activatedElement.set(this.items()[index].element);
    }
  }
}

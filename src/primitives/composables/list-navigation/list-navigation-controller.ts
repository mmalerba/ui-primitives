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
  keydownModifier: ModifierKey | ModifierKey[];
  afterNavigation?: () => void;
}

const defaultOptions: ListNavigationControllerOptions = {
  keydownModifier: ModifierKey.None,
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
      .on(this.options().keydownModifier, previousKey, () => {
        this.navigatePrevious();
      })
      .on(this.options().keydownModifier, nextKey, () => {
        this.navigateNext();
      })
      .on(this.options().keydownModifier, 'Home', () => {
        this.navigateFirst();
      })
      .on(this.options().keydownModifier, 'End', () => {
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
    return this.list.wrapNavigation() && index === 0 ? this.items().length - 1 : index - 1;
  };

  private getNextIndex = (index: number) => getNextIndex(this.list, this.items, index);

  private navigate(initial: number, navigateFn: (i: number) => number): void {
    const index = getIndex(this.items, initial, navigateFn);
    if (index !== -1) {
      this.list.activatedElement.set(this.items()[index].element);
      this.options().afterNavigation?.();
    }
  }
}

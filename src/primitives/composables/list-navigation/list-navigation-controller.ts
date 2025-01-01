import { Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import {
  getIndex,
  getNextIndex,
  ListNavigationItemState,
  ListNavigationState,
} from './list-navigation-state';

export class ListNavigationController implements Controller {
  readonly handlers = {
    click: (e: MouseEvent) => this.clickManager.handle(e),
    keydown: (e: KeyboardEvent) => this.getKeydownManager().handle(e),
  } as const;

  private clickManager = new MouseEventManager().on(MouseButton.Main, (event) => {
    const index = this.items().findIndex((item) => item.element.contains(event.target as Node));
    this.navigateTo(index);
  });

  constructor(
    private readonly list: ListNavigationState,
    private readonly items: Signal<readonly ListNavigationItemState[]>,
  ) {}

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
    }
  }

  private getKeydownManager() {
    const previousKey = this.list.orientation() === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = this.list.orientation() === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    return new KeyboardEventManager()
      .on(previousKey, () => {
        this.navigatePrevious();
      })
      .on(nextKey, () => {
        this.navigateNext();
      })
      .on('Home', () => {
        this.navigateFirst();
      })
      .on('End', () => {
        this.navigateLast();
      });
  }
}

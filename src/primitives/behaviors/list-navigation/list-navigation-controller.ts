import { computed, Signal } from '@angular/core';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { ListNavigationItemState, ListNavigationState } from './list-navigation-behavior';

export class ListNavigationController {
  constructor(
    private readonly list: ListNavigationState,
    private readonly items: Signal<readonly ListNavigationItemState[]>,
  ) {}

  readonly keydownManager = computed(() => {
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
  });

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

  private getNextIndex = (index: number) => {
    return this.list.wrapNavigation() && index === this.items().length - 1 ? 0 : index + 1;
  };

  private navigate(initial: number, navigateFn: (i: number) => number): void {
    const startIndex = navigateFn(initial);
    let index = startIndex;
    while (true) {
      // Don't navigate if we go past the end of the list.
      if (index < 0 || index >= this.items().length) {
        return;
      }
      // If we land on a non-disabled item, stop and navigate to it.
      if (!this.items()[index].disabled()) {
        break;
      }

      index = navigateFn(index);

      // Don't navigate if we loop back around to our starting position.
      if (index === startIndex) {
        return;
      }
    }

    this.list.activatedElement.set(this.items()[index].element);
  }
}

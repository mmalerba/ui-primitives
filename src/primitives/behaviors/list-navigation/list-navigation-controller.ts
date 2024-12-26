import { Signal } from '@angular/core';
import { ListNavigationItemState, ListNavigationState } from './list-navigation-behavior';

export class ListNavigationController {
  constructor(
    private readonly parent: ListNavigationState,
    private readonly items: Signal<readonly ListNavigationItemState[]>,
  ) {}

  navigateTo(index: number): void {
    this.navigate(index, () => index);
  }

  navigatePrevious() {
    this.navigate(this.parent.activeIndex(), this.getPreviousIndex);
  }

  navigateNext() {
    this.navigate(this.parent.activeIndex(), this.getNextIndex);
  }

  navigateFirst() {
    this.navigate(-1, this.getNextIndex);
  }

  navigateLast() {
    this.navigate(-1, this.getPreviousIndex);
  }

  private getPreviousIndex = (index: number) => {
    index = index === -1 ? this.items().length : index;
    return this.parent.wrapNavigation() && index === 0 ? this.items().length - 1 : index - 1;
  };

  private getNextIndex = (index: number) => {
    return this.parent.wrapNavigation() && index === this.items().length - 1 ? 0 : index + 1;
  };

  private navigate(initial: number, navigateFn: (i: number) => number): void {
    const startIndex = navigateFn(initial);
    let index = startIndex;
    while (true) {
      // Don't navigate if we go past the end of the list.
      if (index < 0 || index >= this.items().length) {
        return;
      }
      // If we don't care about disabled state, or we land on a non-disabled item, stop and navigate
      // to it.
      if (!this.parent.navigationSkipsDisabled() || !this.items()[index].disabled()) {
        break;
      }

      index = navigateFn(index);

      // Don't navigate if we loop back around to our starting position.
      if (index === startIndex) {
        return;
      }
    }

    this.parent.activeElement.set(this.items()[index].element);
  }
}

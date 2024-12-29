import { Signal } from '@angular/core';
import { GenericEventManager } from '../../base/event-manager';
import { FocusItemState, FocusState } from './focus-behavior';

export class FocusController {
  readonly focusoutManager = new GenericEventManager<FocusEvent>().on((e) => {
    // If the active element is blurred due to its imminent removal from the DOM,
    // focus the new active element.
    if (this.items()[this.parent.activeIndex()]?.element === e.target) {
      Promise.resolve().then(() => {
        if (!this.parent.element.contains(e.target as Element)) {
          this.items()[this.parent.activeIndex()]?.element.focus();
        }
      });
    }
  });

  constructor(
    private readonly parent: FocusState,
    private readonly items: Signal<readonly FocusItemState[]>,
  ) {}
}

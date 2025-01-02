import { Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { GenericEventManager } from '../../base/event-manager';
import { CompositeFocusItemState, CompositeFocusState } from './composite-focus-state';

export class CompositeFocusController implements Controller {
  readonly handlers = {
    focusout: (e: FocusEvent) => this.focusutManager.handle(e),
  } as const;

  readonly focusutManager = new GenericEventManager<FocusEvent>().on((e) => {
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
    private readonly parent: CompositeFocusState,
    private readonly items: Signal<readonly CompositeFocusItemState[]>,
  ) {}
}

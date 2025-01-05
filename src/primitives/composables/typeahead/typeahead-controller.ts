import { computed, signal, Signal } from '@angular/core';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { TypeaheadItemState, TypeaheadState } from './typeahead-state';

export interface TypeaheadControllerOptions {
  typeaheadMatcher: (item: TypeaheadItemState, query: string) => boolean;
  debounceMs: number;
}

const defaultOptions: TypeaheadControllerOptions = {
  typeaheadMatcher: (item, query) => !!item.element.textContent?.toLowerCase().startsWith(query),
  debounceMs: 500,
};

const validKeyPattern = /[a-z0-9]/i;

export class TypeaheadController {
  private timeout: any;
  private options: Signal<TypeaheadControllerOptions>;

  readonly handlers = {
    keydown: (e: KeyboardEvent) => this.keydownManager.handle(e),
  };

  readonly query = signal('');

  readonly keydownManager = new KeyboardEventManager().on(
    (key) => key.length === 1 && validKeyPattern.test(key),
    (event) => this.search(event.key),
  );

  constructor(
    private parent: TypeaheadState,
    private items: Signal<readonly TypeaheadItemState[]>,
    options?: Signal<Partial<TypeaheadControllerOptions>>,
  ) {
    this.options = computed(() => ({ ...defaultOptions, ...options?.() }));
  }

  search(char: string) {
    clearTimeout(this.timeout);

    this.query.update((str) => str + char.toLowerCase());

    const index = this.items().findIndex((item) =>
      this.options().typeaheadMatcher(item, this.query()),
    );

    if (index !== -1) {
      if (!this.items()[index].disabled()) {
        this.parent.activatedElement.set(this.items()[index].element);
      } else {
        this.items()[index].element.scrollIntoView({
          block: 'nearest',
        });
      }
    }

    this.timeout = setTimeout(() => {
      this.query.set('');
    }, this.options().debounceMs);
  }
}

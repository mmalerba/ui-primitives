import { signal, untracked } from '@angular/core';
import { ExtendableState } from './extendable-state';

export class Behavior<T extends ExtendableState<object> = ExtendableState> {
  readonly removed = signal(false);

  protected readonly listeners: VoidFunction[] = [];

  constructor(protected readonly state: T) {}

  remove() {
    untracked(() => this.removed.set(true));
    for (const unlisten of this.listeners) {
      unlisten();
    }
  }
}

import { ExtendableState } from './extendable-state';

export class Behavior<T extends ExtendableState<object>> {
  protected readonly listeners: VoidFunction[] = [];

  constructor(protected readonly state: T) {}

  remove() {
    for (const unlisten of this.listeners) {
      unlisten();
    }
  }
}

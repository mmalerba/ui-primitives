import { signal, untracked } from '@angular/core';

export abstract class Behavior<S> {
  readonly connected = signal(false);
  initialized = false;

  constructor(protected readonly state: S) {}

  connect() {
    untracked(() => {
      this.connected.set(true);
      if (!this.initialized) {
        this.init();
        this.initialized = true;
      }
    });
  }

  disconnect() {
    untracked(() => {
      this.connected.set(false);
    });
  }

  abstract init(): void;
}

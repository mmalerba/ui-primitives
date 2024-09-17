import { Signal } from '@angular/core';

export class BehaviorEventTarget<T extends Event> {
  private readonly listeners = new Set<(event: T) => void>();

  constructor(readonly connected: Signal<boolean>) {}

  listen(listener: (event: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(event: T) {
    if (!this.connected()) {
      return;
    }
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export class EventDispatcher<T extends Event> {
  private readonly targets = new Set<BehaviorEventTarget<T>>();

  dispatch(event: T) {
    for (const target of this.targets) {
      target.dispatch(event);
    }
  }

  target(connected: Signal<boolean>): BehaviorEventTarget<T> {
    const target = new BehaviorEventTarget<T>(connected);
    this.targets.add(target);
    return target;
  }
}

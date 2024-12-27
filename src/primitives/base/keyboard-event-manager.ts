import { EventHandlerOptions, getModifiers } from './event-modifiers';

export interface KeyboardEventHandlerConfig extends EventHandlerOptions {
  key: string | ((key: string) => boolean);
  modifiers: number;
  handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean);
}

export class KeyboardEventManager {
  private handledKeys: KeyboardEventHandlerConfig[] = [];

  private defaultHandlerOptions: EventHandlerOptions;

  constructor(defaultHandlerOptions?: Partial<EventHandlerOptions>) {
    this.defaultHandlerOptions = {
      preventDefault: true,
      stopPropagation: true,
      ...defaultHandlerOptions,
    };
  }

  on(
    modifiers: number,
    key: string | ((key: string) => boolean),
    handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean),
    options?: Partial<EventHandlerOptions>,
  ): KeyboardEventManager;
  on(
    key: string | ((key: string) => boolean),
    handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean),
    options?: Partial<EventHandlerOptions>,
  ): KeyboardEventManager;
  on(...args: any[]) {
    let modifiers = 0;
    let key: string;
    const first = args.shift();
    if (typeof first === 'number') {
      modifiers = first;
      key = args.shift();
    } else {
      key = first;
    }
    const handler: VoidFunction = args.shift();
    this.handledKeys.push({
      modifiers,
      key,
      handler,
      ...this.defaultHandlerOptions,
      ...args.shift(),
    });
    return this;
  }

  handle(event: KeyboardEvent): boolean {
    let eventHandled = false;
    for (const { key, modifiers, handler, stopPropagation, preventDefault } of this.handledKeys) {
      const keyMatches =
        typeof key === 'string' ? key.toUpperCase() === event.key.toUpperCase() : key(event.key);
      if (keyMatches && modifiers === getModifiers(event)) {
        const handled = handler(event) !== false;
        if (handled) {
          eventHandled = true;
          if (stopPropagation) {
            event.stopPropagation();
          }
          if (preventDefault) {
            event.preventDefault();
          }
        }
      }
    }
    return eventHandled;
  }
}

import { EventHandlerOptions, getModifiers } from './event-modifiers';

export enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
}

export interface MouseEventHandlerConfig extends EventHandlerOptions {
  button: number;
  modifiers: number;
  handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean);
}

export class MouseEventManager {
  private handledButtons: MouseEventHandlerConfig[] = [];

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
    button: MouseButton,
    handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean),
    options?: EventHandlerOptions,
  ): MouseEventManager;
  on(
    button: MouseButton,
    handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean),
    options?: EventHandlerOptions,
  ): MouseEventManager;
  on(...args: any[]) {
    let modifiers = 0;
    let button: MouseButton;
    let handler: VoidFunction;
    const first = args.shift();
    const second = args.shift();
    if (typeof second === 'number') {
      modifiers = first;
      button = second;
      handler = args.shift();
    } else {
      button = first;
      handler = second;
    }
    this.handledButtons.push({
      button,
      modifiers,
      handler,
      ...this.defaultHandlerOptions,
      ...args.shift(),
    });
    return this;
  }

  handle(event: MouseEvent): boolean {
    let eventHandled = false;
    for (const { button, modifiers, handler, stopPropagation, preventDefault } of this
      .handledButtons) {
      if (button === (event.button ?? 0) && modifiers === getModifiers(event)) {
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

export enum ModifierKey {
  None = 0,
  Ctrl = 0b1,
  Shift = 0b10,
  Alt = 0b100,
  Meta = 0b1000,
}

export interface EventWithModifiers extends Event {
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface EventHandlerOptions {
  stopPropagation: boolean;
  preventDefault: boolean;
}

export interface EventHandlerConfig<T extends Event> extends EventHandlerOptions {
  handler: (event: T) => void | boolean;
}

export abstract class EventManager<T extends Event> {
  protected defaultHandlerOptions: EventHandlerOptions;

  constructor(defaultHandlerOptions?: Partial<EventHandlerOptions>) {
    this.defaultHandlerOptions = {
      preventDefault: false,
      stopPropagation: false,
      ...defaultHandlerOptions,
    };
  }

  handle(event: T): boolean {
    const config = this.getHandler(event);
    if (!config) {
      return false;
    }
    if (config.handler(event) === false) {
      return false;
    }
    if (config.stopPropagation) {
      event.stopPropagation();
    }
    if (config.preventDefault) {
      event.preventDefault();
    }
    return true;
  }

  protected abstract getHandler(event: T): EventHandlerConfig<T> | null;
}

export class GenericEventManager<T extends Event> extends EventManager<T> {
  protected config: EventHandlerConfig<T> | null = null;

  on(handler: (event: T) => boolean | void): this {
    this.config = {
      ...this.defaultHandlerOptions,
      handler,
    };
    return this;
  }

  protected getHandler(_event: T): EventHandlerConfig<T> | null {
    return this.config;
  }
}

export function getModifiers(event: EventWithModifiers): number {
  return (
    (+event.ctrlKey && ModifierKey.Ctrl) |
    (+event.shiftKey && ModifierKey.Shift) |
    (+event.altKey && ModifierKey.Alt) |
    (+event.metaKey && ModifierKey.Meta)
  );
}

export function hasModifiers(event: EventWithModifiers, modifiers: number | number[]): boolean {
  const eventModifiers = getModifiers(event);
  const modifiersList = Array.isArray(modifiers) ? modifiers : [modifiers];
  return modifiersList.some((modifiers) => eventModifiers === modifiers);
}

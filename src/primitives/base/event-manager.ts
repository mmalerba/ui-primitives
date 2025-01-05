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
  handler: (event: T) => void;
}

export abstract class EventManager<T extends Event> {
  private submanagers: EventManager<T>[] = [];

  protected configs: EventHandlerConfig<T>[] = [];
  protected beforeFns: ((event: T) => void)[] = [];
  protected afterFns: ((event: T) => void)[] = [];

  protected defaultHandlerOptions: EventHandlerOptions = {
    preventDefault: false,
    stopPropagation: false,
  };

  constructor(defaultHandlerOptions?: Partial<EventHandlerOptions>) {
    this.defaultHandlerOptions = {
      ...this.defaultHandlerOptions,
      ...defaultHandlerOptions,
    };
  }

  static compose<T extends Event>(...managers: EventManager<T>[]) {
    const composedManager = new GenericEventManager<T>();
    composedManager.submanagers = managers;
    return composedManager;
  }

  handle(event: T): true | undefined {
    if (!this.isHandled(event)) {
      return undefined;
    }
    for (const fn of this.beforeFns) {
      fn(event);
    }
    for (const submanager of this.submanagers) {
      submanager.handle(event);
    }
    for (const config of this.getConfigs(event)) {
      config.handler(event);
      if (config.stopPropagation) {
        event.stopPropagation();
      }
      if (config.preventDefault) {
        event.preventDefault();
      }
    }
    for (const fn of this.afterFns) {
      fn(event);
    }
    return true;
  }

  beforeHandling(fn: (event: T) => void): this {
    this.beforeFns.push(fn);
    return this;
  }

  afterHandling(fn: (event: T) => void): this {
    this.afterFns.push(fn);
    return this;
  }

  abstract on(...args: [...unknown[]]): this;

  protected abstract getConfigs(event: T): EventHandlerConfig<T>[];

  protected isHandled(event: T): boolean {
    return this.getConfigs(event).length > 0 || this.submanagers.some((sm) => sm.isHandled(event));
  }
}

export class GenericEventManager<T extends Event> extends EventManager<T> {
  on(handler: (event: T) => boolean | void): this {
    this.configs.push({
      ...this.defaultHandlerOptions,
      handler,
    });
    return this;
  }

  getConfigs(_event: T): EventHandlerConfig<T>[] {
    return this.configs;
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

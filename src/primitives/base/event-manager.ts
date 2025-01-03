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
  override?: boolean;
}

export abstract class EventManager<T extends Event> {
  private submanagers: EventManager<T>[] = [];

  protected configs: EventHandlerConfig<T>[] = [];

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
    let configs = [this, ...this.submanagers].flatMap((sm) => sm.getConfigs(event));
    for (let i = configs.length - 1; i >= 0; i--) {
      if (configs[i].override) {
        configs = configs.slice(i);
        break;
      }
    }
    let handled: true | undefined = undefined;
    for (const config of configs) {
      if (!config || config.handler(event) === false) {
        continue;
      }
      handled = true;
      if (config.stopPropagation) {
        event.stopPropagation();
      }
      if (config.preventDefault) {
        event.preventDefault();
      }
    }
    return handled;
  }

  abstract on(...args: [...unknown[]]): this;

  override(...args: Parameters<this['on']>): this {
    this.on(...args);
    this.configs[this.configs.length - 1].override = true;
    return this;
  }

  protected abstract getConfigs(event: T): EventHandlerConfig<T>[];
}

export class GenericEventManager<T extends Event> extends EventManager<T> {
  on(handler: (event: T) => boolean | void): this {
    this.configs.push({
      ...this.defaultHandlerOptions,
      handler,
    });
    return this;
  }

  override override(handler: (event: T) => boolean | void): this;
  override override(...args: any): this {
    return super.override(...args);
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

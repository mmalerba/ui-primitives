import {
  EventHandlerConfig,
  EventHandlerOptions,
  EventManager,
  hasModifiers,
  ModifierKey,
} from './event-manager';

/**
 * A config that specifies how to handle a particular keyboard event.
 */
export interface KeyboardEventHandlerConfig extends EventHandlerConfig<KeyboardEvent> {
  key: string | ((key: string) => boolean);
  modifiers: number | number[];
}

/**
 * An event manager that is specialized for handling keyboard events. By default this manager stops
 * propagation and prevents default on all events it handles.
 */
export class KeyboardEventManager extends EventManager<KeyboardEvent> {
  override configs: KeyboardEventHandlerConfig[] = [];

  protected override defaultHandlerOptions: EventHandlerOptions = {
    preventDefault: true,
    stopPropagation: true,
  };

  /**
   * Configures this event manager to handle events with a specific modifer and key combination.
   *
   * @param modifiers The modifier combinations that this handler should run for.
   * @param key The key that this handler should run for (or a predicate function that takes the
   *   event's key and returns whether to run this handler).
   * @param handler The handler function
   * @param options Options for whether to stop propagation or prevent default.
   */
  on(
    modifiers: number | number[],
    key: string | ((key: string) => boolean),
    handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean),
    options?: Partial<EventHandlerOptions>,
  ): this;

  /**
   * Configures this event manager to handle events with a specific key and no modifiers.
   *
   * @param key The key that this handler should run for (or a predicate function that takes the
   *   event's key and returns whether to run this handler).
   * @param handler The handler function
   * @param options Options for whether to stop propagation or prevent default.
   */
  on(
    key: string | ((key: string) => boolean),
    handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean),
    options?: Partial<EventHandlerOptions>,
  ): this;

  on(...args: any[]) {
    let modifiers: number | number[] = ModifierKey.None;
    let key: string;
    const first = args.shift();
    if (typeof first === 'number' || Array.isArray(first)) {
      modifiers = first;
      key = args.shift();
    } else {
      key = first;
    }
    const handler: VoidFunction = args.shift();
    this.configs.push({
      modifiers,
      key,
      handler,
      ...this.defaultHandlerOptions,
      ...args.shift(),
    });
    return this;
  }

  getConfigs(event: KeyboardEvent) {
    let configs: KeyboardEventHandlerConfig[] = [];
    for (const config of this.configs) {
      const keyMatches =
        typeof config.key === 'string'
          ? config.key.toUpperCase() === event.key.toUpperCase()
          : config.key(event.key);
      if (keyMatches && hasModifiers(event, config.modifiers)) {
        configs.push(config);
      }
    }
    return configs;
  }
}

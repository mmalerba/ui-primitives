import {
  EventHandlerConfig,
  EventHandlerOptions,
  EventManager,
  hasModifiers,
  ModifierKey,
} from './event-manager';

export interface KeyboardEventHandlerConfig extends EventHandlerConfig<KeyboardEvent> {
  key: string | ((key: string) => boolean);
  modifiers: number | number[];
}

export class KeyboardEventManager extends EventManager<KeyboardEvent> {
  override configs: KeyboardEventHandlerConfig[] = [];

  protected override defaultHandlerOptions: EventHandlerOptions = {
    preventDefault: true,
    stopPropagation: true,
  };

  on(
    modifiers: number | number[],
    key: string | ((key: string) => boolean),
    handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => boolean),
    options?: Partial<EventHandlerOptions>,
  ): this;
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

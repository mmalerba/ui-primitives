import {
  EventHandlerConfig,
  EventHandlerOptions,
  EventManager,
  hasModifiers,
  ModifierKey,
} from './event-manager';

export enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
}

export interface MouseEventHandlerConfig extends EventHandlerConfig<MouseEvent> {
  button: number;
  modifiers: number | number[];
}

export class MouseEventManager extends EventManager<MouseEvent> {
  override configs: MouseEventHandlerConfig[] = [];

  protected override defaultHandlerOptions: EventHandlerOptions = {
    preventDefault: true,
    stopPropagation: true,
  };

  on(
    modifiers: number | number[],
    button: MouseButton,
    handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean),
    options?: EventHandlerOptions,
  ): this;
  on(
    button: MouseButton,
    handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean),
    options?: EventHandlerOptions,
  ): this;
  on(...args: any[]) {
    let modifiers = ModifierKey.None;
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
    this.configs.push({
      button,
      modifiers,
      handler,
      ...this.defaultHandlerOptions,
      ...args.shift(),
    });
    return this;
  }

  getConfigs(event: MouseEvent) {
    const configs: MouseEventHandlerConfig[] = [];
    for (const config of this.configs) {
      if (config.button === (event.button ?? 0) && hasModifiers(event, config.modifiers)) {
        configs.push(config);
      }
    }
    return configs;
  }
}

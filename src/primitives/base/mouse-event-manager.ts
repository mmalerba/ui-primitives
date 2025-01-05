import {
  EventHandlerConfig,
  EventHandlerOptions,
  EventManager,
  hasModifiers,
  ModifierKey,
} from './event-manager';

/**
 * The different mouse buttons that may appear on a mouse event.
 */
export enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
}

/**
 * A config that specifies how to handle a particular mouse event.
 */
export interface MouseEventHandlerConfig extends EventHandlerConfig<MouseEvent> {
  button: number;
  modifiers: number | number[];
}

/**
 * An event manager that is specialized for handling mouse events. By default this manager stops
 * propagation and prevents default on all events it handles.
 */
export class MouseEventManager extends EventManager<MouseEvent> {
  override configs: MouseEventHandlerConfig[] = [];

  protected override defaultHandlerOptions: EventHandlerOptions = {
    preventDefault: true,
    stopPropagation: true,
  };

  /**
   * Configures this event manager to handle events with a specific modifer and mouse button
   * combination.
   *
   * @param modifiers The modifier combinations that this handler should run for.
   * @param button The mouse button that this handler should run for.
   * @param handler The handler function
   * @param options Options for whether to stop propagation or prevent default.
   */
  on(
    modifiers: number | number[],
    button: MouseButton,
    handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => boolean),
    options?: EventHandlerOptions,
  ): this;

  /**
   * Configures this event manager to handle events with a specific mouse button and no modifiers.
   *
   * @param button The mouse button that this handler should run for.
   * @param handler The handler function
   * @param options Options for whether to stop propagation or prevent default.
   */
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

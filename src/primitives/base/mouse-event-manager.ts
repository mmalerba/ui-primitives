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
  private handledButtons: MouseEventHandlerConfig[] = [];

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
    this.handledButtons.push({
      button,
      modifiers,
      handler,
      ...this.defaultHandlerOptions,
      ...args.shift(),
    });
    return this;
  }

  override getHandler(event: MouseEvent) {
    for (const config of this.handledButtons) {
      if (config.button === (event.button ?? 0) && hasModifiers(event, config.modifiers)) {
        return config;
      }
    }
    return null;
  }
}

import { MutableSignals, StateGraph } from './graph';

export type BehaviorEventHandlers<
  M extends MutableSignals<StateGraph>,
  S extends StateGraph,
  E extends keyof GlobalEventHandlersEventMap
> = {
  [P in E]: (model: M, state: S, event: GlobalEventHandlersEventMap[E]) => void;
} & {
  [P in Exclude<keyof GlobalEventHandlersEventMap, E>]?: never;
};

export class EventDispatcher<T extends Event> {
  private readonly listeners = new Set<(event: T) => void>();

  listen(listener: (event: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(event: T) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export interface Controller {
  handlers: Partial<{
    readonly [K in keyof GlobalEventHandlersEventMap]: (
      e: GlobalEventHandlersEventMap[K],
    ) => true | undefined;
  }>;
}

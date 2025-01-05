/**
 * A controller used to handle events associated with some particular state.
 */
export interface Controller {
  /**
   * Handlers for each of the events this controller wants to handle.
   */
  handlers: Partial<{
    readonly [K in keyof GlobalEventHandlersEventMap]: (
      e: GlobalEventHandlersEventMap[K],
    ) => true | undefined;
  }>;
}

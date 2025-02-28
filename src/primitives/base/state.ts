import { computed, linkedSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';

/**
 * Internal property on a computation function that indicates the computation should be wrapped into
 * a writeable signal rather than a readonly one.
 */
const WRITABLE = Symbol('writable');

/**
 * Internal property on item state that holds a signal of the item's index in the list. This allows
 * the item's state to update reactively based on the item's position in the list.
 */
const INDEX = Symbol('index');

/**
 * An object representing the state associated with an element. Each property may be a signal to
 * represent reactive state, or a plain value to represent static state.
 */
export type State = Record<PropertyKey, any>;

/**
 * Unwraps the value type from a `Signal`, or leaves the type unchanged if it is not a signal.
 */
export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;

/**
 * Arguments passed to a parent state computation function.
 */
export type ParentComputationArgs<PI, II, PO, IO> = {
  /**
   * The parent's state after computations are applied.
   */
  self: PI & PO;
  /**
   * The state of all items after computations are applied.
   */
  items: Signal<readonly (II & IO)[]>;
};

/**
 * Arguments passed to an item state computation function.
 */
export type ItemComputationArgs<PI, II, PO, IO> = {
  /**
   * The item's state after computations are applied.
   */
  self: II & IO;
  /**
   * The parent's state after computations are applied.
   */
  parent: PI & PO;
  /**
   * The index of the item in the parent.
   */
  index: Signal<number>;
};

/**
 * A state computation function to be wrapped in a `computed` / `linkedSignal`. Given a set of named
 * arguments, it produces a value for the output signal.
 */
export type StateComputationFn<A extends Record<string, any>, O> = ((args: A) => UnwrapSignal<O>) &
  (O extends WritableSignal<any> ? { [WRITABLE]: true } : {});

/**
 * The full set of computation functions for the given input and output state objects. Each property
 * in the output must have a computation function. If the same property exists in the input, the
 * computation function recevies that input value as an additional argument.
 */
export type StateComputations<A extends Record<string, any>, I extends State, O extends State> = {
  [K in keyof O]: O[K] extends Signal<any>
    ? StateComputationFn<K extends keyof I ? A & { inputValue: I[K] } : A, O[K]>
    : never;
};

/**
 * Schema that defines how to derive output state properties from input state properties for both a
 * parent element and associated items. It may additionally define synchronization logic needed for
 * this state (for exmaple focusing an element programatically when it becomes active).
 */
export type StateSchema<PI extends State, II extends State, PO extends State, IO extends State> = {
  /**
   * The set of computations that produces the output state for the parent and items.
   */
  computations: (PO extends Record<PropertyKey, never>
    ? { parent?: Record<PropertyKey, never> }
    : { parent: StateComputations<ParentComputationArgs<PI, II, PO, IO>, PI, PO> }) &
    (IO extends Record<PropertyKey, never>
      ? { item?: Record<PropertyKey, never> }
      : { item: StateComputations<ItemComputationArgs<PI, II, PO, IO>, II, IO> });
  /**
   * A list of functions used to synchronize the state with the DOM.
   * (e.g. to call `.focus()` on an element)
   */
  sync?: ((arg: { parent: PI & PO; items: Signal<readonly (II & IO)[]> }) => void)[];
};

/**
 * Defines a state schema based on composing other state schemas.
 */
export type ComposedStateSchema<T extends [...StateSchema<any, any, any, any>[]]> = T extends [
  StateSchema<infer PI1, infer II1, infer PO1, infer IO1>,
  ...infer R1,
]
  ? R1 extends [StateSchema<infer PI2, infer II2, infer PO2, infer IO2>, ...infer R2]
    ? R2 extends [...StateSchema<any, any, any, any>[]]
      ? ComposedStateSchema<
          [
            StateSchema<
              PI1 & Omit<PI2, keyof PO1>,
              II1 & Omit<II2, keyof IO1>,
              PO1 & PO2,
              IO1 & IO2
            >,
            ...R2,
          ]
        >
      : StateSchema<PI1 & Omit<PI2, keyof PO1>, II1 & Omit<II2, keyof IO1>, PO1 & PO2, IO1 & IO2>
    : StateSchema<PI1, II1, PO1, IO1>
  : never;

/**
 * Extracts the parent input state type from a state schema.
 */
export type ParentInputType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<infer PI, any, any, any> ? PI : never;

/**
 * Extracts the item input state type from a state schema.
 */
export type ItemInputType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<any, infer II, any, any> ? II : never;

/**
 * Extracts the parent output state type from a state schema.
 */
export type ParentOutputType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<any, any, infer PO, any> ? PO : never;

/**
 * Extracts the item output state type from a state schema.
 */
export type ItemOutputType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<any, any, any, infer IO> ? IO : never;

/**
 * Extracts the full parent state type from a state schema.
 */
export type ParentStateType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<infer PI, any, infer PO, any> ? PI & PO : never;

/**
 * Extracts the full item state type from a state schema.
 */
export type ItemStateType<T extends StateSchema<any, any, any, any>> =
  T extends StateSchema<any, infer II, any, infer IO> ? II & IO : never;

/**
 * The full instance state for the parent and items, created from a its StateSchema.
 */
export type InstanceState<S extends StateSchema<any, any, any, any>, ID = unknown> = {
  /**
   * The parent's full state.
   */
  parentState: ParentStateType<S>;
  /**
   * A map of item input states to that item's full state.
   */
  itemStatesMap: Signal<Map<ID, ItemStateType<S>>>;
  /**
   * A list of full item states.
   */
  itemStates: Signal<readonly ItemStateType<S>[]>;
  /**
   * A list of functions used to synchronize the state with the DOM.
   */
  syncFns: (() => void)[];
};

/**
 * Creates the instance state for the given schema and inputs.
 */
export function createState<
  S extends StateSchema<any, any, any, any>,
  PI extends ParentInputType<S>,
  II extends ItemInputType<S>,
>(schema: S, parentInputs: PI, itemsInputs: Signal<readonly II[]>): InstanceState<S, II>;
export function createState<
  S extends StateSchema<any, any, any, any>,
  PI extends ParentInputType<S>,
  II extends ItemInputType<S>,
  ID,
>(
  schema: S,
  parentInputs: PI,
  itemsInputs: Signal<readonly II[]>,
  itemInputIdentity: (item: II) => ID,
): InstanceState<S, ID>;
export function createState<S extends StateSchema<any, any, any, any>>(
  schema: S,
  parentInputs: ParentInputType<S>,
  itemsInputs: Signal<readonly ItemInputType<S>[]>,
  itemInputIdentity = (item: ItemInputType<S>) => item,
): InstanceState<S, unknown> {
  // Create the parent state
  const parentState = { ...parentInputs } as ParentStateType<S>;
  for (const [property, computation] of Object.entries(schema.computations.parent ?? {})) {
    if (!computation) {
      continue;
    }
    (parentState as Record<string, unknown>)[property] = computed(() =>
      computation({
        self: parentState,
        items: itemStates,
        inputValue: parentInputs[property],
      } as any),
    );
    // Make the state property writable if it's marked as such in the schema.
    if ((computation as any)[WRITABLE]) {
      (parentState as Record<string, unknown>)[property] = linkedSignal(parentState[property]);
    }
  }

  // Create a map of child inputs to child state. This allows us to maintain the same set of state
  // for a child even as it moves around in the list of items.
  const itemStatesMap = linkedSignal<
    readonly ItemInputType<S>[],
    Map<ItemInputType<S>, ItemStateType<S> & { [INDEX]: WritableSignal<number> }>
  >({
    source: itemsInputs,
    computation: (newItemsInputs, previous) => {
      // If we have all the same items as before, just reuse the same map. However, the item indices
      // may have changed, so we need to update those.
      const previousItemStates = previous?.value;
      if (
        previousItemStates &&
        newItemsInputs.length === previousItemStates.size &&
        newItemsInputs.every((itemInputs) => previousItemStates.has(itemInputIdentity(itemInputs)))
      ) {
        for (let idx = 0; idx < newItemsInputs.length; idx++) {
          untracked(() =>
            previousItemStates.get(itemInputIdentity(newItemsInputs[idx]))![INDEX].set(idx),
          );
        }
        return previousItemStates;
      }
      // Otherwise we need to create a new map.
      return new Map(
        newItemsInputs.map((itemInputs, idx) => {
          const ident = itemInputIdentity(itemInputs);
          // For items that exist in the previous map, reuse the same state, but again update
          // their index.
          if (previousItemStates?.has(ident)) {
            untracked(() => previousItemStates.get(ident)![INDEX].set(idx));
            return [ident, previousItemStates.get(ident)!] as const;
          }
          // For new ones, create a new state for them.
          const itemState = {
            ...itemInputs,
            [INDEX]: signal(idx),
          } as ItemStateType<S> & { [INDEX]: WritableSignal<number> };
          for (const [property, computation] of Object.entries(schema.computations.item ?? {})) {
            if (!computation) {
              continue;
            }
            (itemState as Record<string, unknown>)[property] = computed(() =>
              computation({
                self: itemState,
                parent: parentState,
                index: itemState[INDEX],
                inputValue: itemInputs[property],
              } as any),
            );
            // Make the state property writable if it's marked as such in the schema.
            if ((computation as any)[WRITABLE]) {
              (itemState as Record<string, unknown>)[property] = linkedSignal(itemState[property]);
            }
          }
          return [ident, itemState] as const;
        }),
      );
    },
  });

  // Create a list of the item states
  const itemStates = computed(() =>
    itemsInputs().map((i) => itemStatesMap().get(itemInputIdentity(i))!),
  );

  // Create a list of all the sync functions.
  const syncFns =
    schema.sync?.map((fn) => () => fn({ parent: parentState, items: itemStates })) ?? [];

  return { parentState, itemStatesMap, itemStates, syncFns };
}

/**
 * Composes multiple state schemas into a single schema that combines their state.
 *
 * Two schemas are composed as follows:
 * - The input state for the new schema consists of the input properties for the first schema, plus
 *   any input properties for the second schema that are not provided by the first schema's output
 *   state.
 * - The output state for the new schema consists of all properties in the output state of both
 *   schemas.
 * - If both schemas define computations for the same property, the new schema will define a new
 *   computation by composing the functions, with the result of the first schema's computation being
 *   passed as the named `inputValue` argument to the second schema's computation function.
 *
 * If more than two schemas are provided, they are composed pairwise from left to right, according
 * to the proccess above.
 */
export function composeStates<T extends StateSchema<any, any, any, any>[]>(
  ...schemas: T
): ComposedStateSchema<T> {
  return {
    computations: {
      parent: composeComputations(schemas.map((s) => s.computations.parent) as any),
      item: composeComputations(schemas.map((s) => s.computations.item) as any),
    },
    sync: schemas.flatMap((s) => s.sync ?? []),
  } as any;
}

/**
 * Marks a schema computation function as writable, meaning it will be wrapped in a `linkedSignal`
 * rather than a `computed` when building the final state.
 */
export function writable<T>(fn: T): T & { [WRITABLE]: true } {
  (fn as any)[WRITABLE] = true;
  return fn as any;
}

function composeComputations(
  computations: (StateComputations<Record<string, unknown>, State, State> | undefined)[],
): StateComputations<Record<string, unknown>, State, State> | undefined {
  const computationLists: Record<
    PropertyKey,
    StateComputations<Record<string, unknown>, State, State>[PropertyKey][]
  > = {};
  for (const [property, computation] of computations.flatMap((c) => Object.entries(c ?? {}))) {
    if (!computation) {
      continue;
    }
    const computationList = computationLists[property] ?? [];
    computationList.push(computation);
    computationLists[property] = computationList;
  }
  if (!Object.keys(computationLists).length) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(computationLists).map(([property, computations]) => {
      return [property, composeComputationFunctions(computations)!];
    }),
  );
}

function composeComputationFunctions(
  fns: StateComputations<Record<string, unknown>, State, State>[PropertyKey][],
): StateComputations<Record<string, unknown>, State, State>[PropertyKey] | undefined {
  if (!fns.length) {
    return undefined;
  }
  let fn = fns[0]!;
  for (let i = 1; i < fns.length; i++) {
    const prevFn = fn;
    const nextFn = fns[i];
    fn = (args) => nextFn({ ...args, inputValue: () => prevFn(args) });
  }
  if (fns.some((f) => (f as any)[WRITABLE])) {
    (fn as any)[WRITABLE] = true;
  }
  return fn;
}

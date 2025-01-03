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
  self: PI & PO;
  items: Signal<readonly (II & IO)[]>;
};

/**
 * Arguments passed to an item state computation function.
 */
export type ItemComputationArgs<PI, II, PO, IO> = {
  self: II & IO;
  parent: PI & PO;
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
export type StateSchema<
  PI extends State,
  II extends State,
  PO extends State,
  IO extends State,
> = (PO extends Record<PropertyKey, never>
  ? { computations?: Record<PropertyKey, never> }
  : {
      computations: StateComputations<ParentComputationArgs<PI, II, PO, IO>, PI, PO>;
    }) &
  (IO extends Record<PropertyKey, never>
    ? { itemComputations?: Record<PropertyKey, never> }
    : {
        itemComputations: StateComputations<ItemComputationArgs<PI, II, PO, IO>, II, IO>;
      }) & {
    sync?: ((arg: { parent: PI & PO; items: Signal<readonly (II & IO)[]> }) => void)[];
  };

/**
 * Defines a state schema based on composing two other state schemas.
 */
export type ComposedStateSchema<
  S1 extends StateSchema<any, any, any, any>,
  S2 extends StateSchema<any, any, any, any>,
> =
  S1 extends StateSchema<infer PI1, infer II1, infer PO1, infer IO1>
    ? S2 extends StateSchema<infer PI2, infer II2, infer PO2, infer IO2>
      ? StateSchema<PI1 & Omit<PI2, keyof PO1>, II1 & Omit<II2, keyof IO1>, PO1 & PO2, IO1 & IO2>
      : never
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

export type InstanceState<S extends StateSchema<any, any, any, any>> = {
  parentState: ParentStateType<S>;
  itemStatesMap: Signal<Map<ItemInputType<S>, ItemStateType<S>>>;
  itemStates: Signal<readonly ItemStateType<S>[]>;
  syncFns: (() => void)[];
};

export function createState<S extends StateSchema<any, any, any, any>>(
  schema: S,
  parentInputs: ParentInputType<S>,
  itemsInputs: Signal<readonly ItemInputType<S>[]>,
): InstanceState<S> {
  // Create the parent state
  const parentState = { ...parentInputs } as ParentStateType<S>;
  for (const [property, computation] of Object.entries(schema.computations ?? {})) {
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
        newItemsInputs.every((itemInputs) => previousItemStates.has(itemInputs))
      ) {
        for (let idx = 0; idx < newItemsInputs.length; idx++) {
          untracked(() => previousItemStates.get(newItemsInputs[idx])![INDEX].set(idx));
        }
        return previousItemStates;
      }
      // Otherwise we need to create a new map.
      return new Map(
        newItemsInputs.map((itemInputs, idx) => {
          // For items that exist in the previous map, reuse the same state, but again update
          // their index.
          if (previousItemStates?.has(itemInputs)) {
            untracked(() => previousItemStates.get(itemInputs)![INDEX].set(idx));
            return [itemInputs, previousItemStates.get(itemInputs)!] as const;
          }
          // For new ones, create a new state for them.
          const itemState = {
            ...itemInputs,
            [INDEX]: signal(idx),
          } as ItemStateType<S> & { [INDEX]: WritableSignal<number> };
          for (const [property, computation] of Object.entries(schema.itemComputations ?? {})) {
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
          return [itemInputs, itemState] as const;
        }),
      );
    },
  });

  // Create a list of the item states
  const itemStates = computed(() => itemsInputs().map((v) => itemStatesMap().get(v)!));

  // Create a list of all the sync functions.
  const syncFns =
    schema.sync?.map((fn) => () => fn({ parent: parentState, items: itemStates })) ?? [];

  return { parentState, itemStatesMap, itemStates, syncFns } as const;
}

export function composeSchema<
  S1 extends StateSchema<any, any, any, any>,
  S2 extends StateSchema<any, any, any, any>,
>(s1: S1, s2: S2): ComposedStateSchema<S1, S2> {
  const computations = composeComputations(
    s1.computations as StateComputations<Record<string, unknown>, State, State>,
    s2.computations as StateComputations<Record<string, unknown>, State, State>,
  );
  const itemComputations = composeComputations(
    s1.itemComputations as StateComputations<Record<string, unknown>, State, State>,
    s2.itemComputations as StateComputations<Record<string, unknown>, State, State>,
  );
  const sync = [...(s1.sync ?? []), ...(s2.sync ?? [])];
  return {
    computations,
    itemComputations,
    sync,
  } as ComposedStateSchema<S1, S2>;
}

export function writable<T>(fn: T): T & { [WRITABLE]: true } {
  (fn as any)[WRITABLE] = true;
  return fn as any;
}

function composeComputations(
  ...computations: (StateComputations<Record<string, unknown>, State, State> | undefined)[]
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

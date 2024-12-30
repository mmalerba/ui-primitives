import { computed, linkedSignal, signal, Signal, untracked, WritableSignal } from '@angular/core';

export type State<
  I extends Record<PropertyKey, any> = Record<PropertyKey, any>,
  O extends Record<PropertyKey, any> = I,
> = {
  [K in Exclude<keyof I, keyof O>]: I[K];
} & {
  [K in keyof O]: O[K];
};

export type UnwrapSignal<T> = T extends Signal<infer U> ? U : T;

export type StateComputations<A extends Record<string, any>, I extends State, O extends State> = {
  [K in keyof (I | O)]: I[K] extends Signal<any>
    ? ((args: A & { inputValue: I[K] }) => UnwrapSignal<O[K]>) &
        (O[K] extends WritableSignal<any> ? { [WRITABLE]: true } : {})
    : never;
} & {
  [K in Exclude<keyof O, keyof I>]: O[K] extends Signal<any>
    ? ((args: A) => UnwrapSignal<O[K]>) &
        (O[K] extends WritableSignal<any> ? { [WRITABLE]: true } : {})
    : never;
} & {
  [K in keyof O]: unknown;
};

export type Behavior<
  PI extends State,
  II extends State,
  PO extends State,
  IO extends State,
> = ({} extends PO
  ? { computations?: undefined }
  : {
      computations: StateComputations<
        {
          self: State<PI, PO>;
          items: Signal<readonly State<II, IO>[]>;
          inputs: { self: PI; items: Signal<readonly II[]> };
        },
        PI,
        PO
      >;
    }) &
  ({} extends IO
    ? { itemComputations?: undefined }
    : {
        itemComputations: StateComputations<
          {
            self: State<II, IO>;
            parent: State<PI, PO>;
            index: Signal<number>;
            inputs: { self: II; parent: PI };
          },
          II,
          IO
        >;
      }) & {
    sync?: ((arg: { parent: State<PI, PO>; items: Signal<readonly State<II, IO>[]> }) => void)[];
  };

export type ComposedBehavior<
  PI1 extends State,
  II1 extends State,
  PO1 extends State,
  IO1 extends State,
  PI2 extends State,
  II2 extends State,
  PO2 extends State,
  IO2 extends State,
> = Behavior<
  PI1 & Omit<PI2, keyof PO1>,
  II1 & Omit<II2, keyof IO1>,
  State<PO1, PO2>,
  State<IO1, IO2>
>;

const WRITABLE = Symbol('writable');

// Special property on item state that holds the index of the item in the list. We need this since
// the item can move around in the list and we want the item's state to be able to update based on
// changes in its index.
const INDEX = Symbol('index');

export function applyBehavior<
  PI extends State,
  II extends State,
  PO extends State,
  IO extends State,
>(behavior: Behavior<PI, II, PO, IO>, parentInputs: PI, itemsInputs: Signal<readonly II[]>) {
  // Create the parent state
  const parentState: State<PI, PO> = { ...parentInputs };
  for (const [property, computation] of Object.entries(behavior.computations ?? {})) {
    if (!computation) {
      continue;
    }
    (parentState as Record<string, unknown>)[property] = computed(() =>
      computation({
        self: parentState,
        items: itemStates,
        inputs: { self: parentInputs, items: itemsInputs },
        inputValue: parentInputs[property],
      }),
    );
    // Make the state property writable if it's marked as such in the behavior.
    if ((computation as any)[WRITABLE]) {
      (parentState as Record<string, unknown>)[property] = linkedSignal(parentState[property]);
    }
  }

  // Create a map of child inputs to child state. This allows us to maintain the same set of state
  // for a child even as it moves around in the list of items.
  const itemStatesMap = linkedSignal<
    readonly II[],
    Map<II, State<II, IO> & { [INDEX]: WritableSignal<number> }>
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
          const itemState: State<II, IO> & { [INDEX]: WritableSignal<number> } = {
            ...itemInputs,
            [INDEX]: signal(idx),
          };
          for (const [property, computation] of Object.entries(behavior.itemComputations ?? {})) {
            if (!computation) {
              continue;
            }
            (itemState as Record<string, unknown>)[property] = computed(() =>
              computation({
                self: itemState,
                parent: parentState,
                index: itemState[INDEX],
                inputs: { self: itemInputs, parent: parentInputs },
                inputValue: itemInputs[property],
              }),
            );
            // Make the state property writable if it's marked as such in the behavior.
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
    behavior.sync?.map((fn) => () => fn({ parent: parentState, items: itemStates })) ?? [];

  return { parentState, itemStatesMap, itemStates, syncFns } as const;
}

// TODO: rework this to be compatible with accessing full inputs
export function composeBehavior<
  PI1 extends State,
  II1 extends State,
  PO1 extends State,
  IO1 extends State,
  PI2 extends State,
  II2 extends State,
  PO2 extends State,
  IO2 extends State,
>(
  b1: Behavior<PI1, II1, PO1, IO1>,
  b2: Behavior<PI2, II2, PO2, IO2>,
): ComposedBehavior<PI1, II1, PO1, IO1, PI2, II2, PO2, IO2> {
  const computations = composeComputations(
    b1.computations as StateComputations<Record<string, unknown>, State, State>,
    b2.computations as StateComputations<Record<string, unknown>, State, State>,
  );
  const itemComputations = composeComputations(
    b1.itemComputations as StateComputations<Record<string, unknown>, State, State>,
    b2.itemComputations as StateComputations<Record<string, unknown>, State, State>,
  );
  const sync = [...(b1.sync ?? []), ...(b2.sync ?? [])];
  return {
    computations,
    itemComputations,
    sync,
  } as unknown as ComposedBehavior<PI1, II1, PO1, IO1, PI2, II2, PO2, IO2>;
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
  let fn = fns.shift()!;
  let fn2: typeof fn | undefined;
  while ((fn2 = fns.shift())) {
    fn = (args) => fn2!({ ...args, inputValue: () => fn(args) });
  }
  if (fns.some((f) => (f as any)[WRITABLE])) {
    (fn as any)[WRITABLE] = true;
  }
  return fn;
}

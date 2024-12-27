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
    ? (args: A & { inputValue: I[K] }) => UnwrapSignal<I[K]>
    : never;
} & {
  [K in Exclude<keyof O, keyof I>]: O[K] extends Signal<any>
    ? (args: A) => UnwrapSignal<O[K]>
    : never;
} & {
  [K in keyof O]: unknown;
};

export type PickWritable<T extends State> = {
  [K in keyof T as T[K] extends WritableSignal<any> ? K : never]: T[K];
};

export type MakeWritableBlock<PO extends State, IO extends State> = ({} extends PickWritable<PO>
  ? { parent?: undefined }
  : {
      parent: { [K in keyof PickWritable<PO>]: true } & {
        [K in keyof Omit<PO, keyof PickWritable<PO>>]?: undefined;
      };
    }) &
  ({} extends PickWritable<IO>
    ? { item?: undefined }
    : {
        item: { [K in keyof PickWritable<IO>]: true } & {
          [K in keyof Omit<IO, keyof PickWritable<IO>>]?: undefined;
        };
      });

export type Behavior<
  PI extends State,
  II extends State,
  PO extends State,
  IO extends State,
> = ({} extends PO
  ? { computations?: undefined }
  : {
      computations: StateComputations<
        { self: State<PI, PO>; items: Signal<readonly State<II, IO>[]> },
        PI,
        PO
      >;
    }) &
  ({} extends IO
    ? { itemComputations?: undefined }
    : {
        itemComputations: StateComputations<
          { self: State<II, IO>; parent: State<PI, PO>; index: Signal<number> },
          II,
          IO
        >;
      }) &
  ({} extends PickWritable<PO & IO>
    ? { makeWritable?: undefined }
    : { makeWritable: MakeWritableBlock<PO, IO> });

export type ComposedBehavior<
  PI1 extends State,
  II1 extends State,
  PO1 extends State,
  IO1 extends State,
  PO2 extends State,
  IO2 extends State,
> = Behavior<PI1, II1, State<PO1, PO2>, State<IO1, IO2>>;

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
        inputValue: parentInputs[property],
      }),
    );
    // Make the state property writable if it's marked as such in the behavior.
    if ((behavior.makeWritable?.parent as Record<string, unknown>)?.[property]) {
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
                inputValue: itemInputs[property],
              }),
            );
            // Make the state property writable if it's marked as such in the behavior.
            if ((behavior.makeWritable?.item as Record<string, unknown>)?.[property]) {
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

  return { parentState, itemStatesMap, itemStates } as const;
}

export function composeBehavior<
  PI1 extends State,
  II1 extends State,
  PO1 extends State,
  IO1 extends State,
  PI2 extends Partial<State<PI1, PO1>>,
  II2 extends Partial<State<PI1, PO1>>,
  PO2 extends State,
  IO2 extends State,
>(
  b1: Behavior<PI1, II1, PO1, IO1>,
  b2: Behavior<PI2, II2, PO2, IO2>,
): ComposedBehavior<PI1, II1, PO1, IO1, PO2, IO2> {
  const computations = composeComputations(
    b1.computations as StateComputations<Record<string, unknown>, State, State>,
    b2.computations as StateComputations<Record<string, unknown>, State, State>,
  );
  const itemComputations = composeComputations(
    b1.itemComputations as StateComputations<Record<string, unknown>, State, State>,
    b2.itemComputations as StateComputations<Record<string, unknown>, State, State>,
  );
  const makeWritableParent = {
    ...(b1.makeWritable?.parent ?? {}),
    ...(b2.makeWritable?.parent ?? {}),
  };
  const makeWritableItem = {
    ...(b1.makeWritable?.item ?? {}),
    ...(b2.makeWritable?.item ?? {}),
  };
  const makeWritable =
    Object.keys(makeWritableParent).length || Object.keys(makeWritableItem).length
      ? {
          parent: Object.keys(makeWritableParent).length ? makeWritableParent : undefined,
          item: Object.keys(makeWritableItem).length ? makeWritableItem : undefined,
        }
      : undefined;
  return {
    computations,
    itemComputations,
    makeWritable,
  } as unknown as ComposedBehavior<PI1, II1, PO1, IO1, PO2, IO2>;
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
  return fn;
}

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
  [K in keyof I]?: I[K] extends Signal<any>
    ? (args: A & { inputValue: UnwrapSignal<I[K]> }) => UnwrapSignal<I[K]>
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

export type MakeWritableBlock<PO extends State, CO extends State> = ({} extends PickWritable<PO>
  ? { parent?: undefined }
  : {
      parent: { [K in keyof PickWritable<PO>]: true } & {
        [K in keyof Omit<PO, keyof PickWritable<PO>>]?: undefined;
      };
    }) &
  ({} extends PickWritable<CO>
    ? { item?: undefined }
    : {
        item: { [K in keyof PickWritable<CO>]: true } & {
          [K in keyof Omit<CO, keyof PickWritable<CO>>]?: undefined;
        };
      });

export type Behavior<
  PI extends State,
  CI extends State,
  PO extends State,
  CO extends State,
> = ({} extends PO
  ? { computations?: undefined }
  : {
      computations: StateComputations<
        { self: State<PI, PO>; items: Signal<readonly State<CI, CO>[]> },
        PI,
        PO
      >;
    }) &
  ({} extends CO
    ? { itemComputations?: undefined }
    : {
        itemComputations: StateComputations<
          { self: State<CI, CO>; parent: State<PI, PO>; index: Signal<number> },
          CI,
          CO
        >;
      }) &
  ({} extends PickWritable<PO & CO>
    ? { makeWritable?: undefined }
    : { makeWritable: MakeWritableBlock<PO, CO> });

// Special property on item state that holds the index of the item in the list. We need this since
// the item can move around in the list and we want the item's state to be able to update based on
// changes in its index.
const INDEX = Symbol('index');

export function applyBehavior<
  PI extends State,
  CI extends State,
  PO extends State,
  CO extends State,
>(behavior: Behavior<PI, CI, PO, CO>, parentInputs: PI, itemsInputs: Signal<readonly CI[]>) {
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
        inputValue: parentInputs[property]?.(),
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
    readonly CI[],
    Map<CI, State<CI, CO> & { [INDEX]: WritableSignal<number> }>
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
          const itemState: State<CI, CO> & { [INDEX]: WritableSignal<number> } = {
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
                inputValue: itemInputs[property]?.(),
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

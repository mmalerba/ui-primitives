import {
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  linkedSignal,
  signal,
  Signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { Behavior, State } from '../base/behavior';
import {
  rovingTabindexBehavior,
  RovingTabindexItemInputs,
  RovingTabindexItemState,
  RovingTabindexState,
} from '../behaviors/roving-tabindex';

@Directive({
  selector: '[rovingTabindex]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state.tabindex()',
  },
})
export class RovingTabindexDirective {
  activeIndex = input.required<number>();

  items = contentChildren(RovingTabindexItemDirective);

  state: RovingTabindexState;
  itemStates: Signal<Map<RovingTabindexItemInputs, RovingTabindexItemState>>;

  constructor() {
    const [state, itemStates] = applyBehavior(rovingTabindexBehavior, this, this.items);
    this.state = state;
    this.itemStates = itemStates;
  }
}

@Directive({
  selector: '[rovingTabindexItem]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state().tabindex()',
    '[class.active]': 'state().active()',
  },
})
export class RovingTabindexItemDirective {
  parent = inject(RovingTabindexDirective);

  state = computed(() => this.parent.itemStates().get(this));
}

// Special property on item state that holds the index of the item in the list. We need this since
// the item can move around in the list and we want the item's state to be able to update based on
// changes in its index.
const INDEX = Symbol('index');

function applyBehavior<PI extends State, CI extends State, PO extends State, CO extends State>(
  behavior: Behavior<PI, CI, PO, CO>,
  parentInputs: PI,
  itemsInputs: Signal<readonly CI[]>,
) {
  // Create the parent state
  const parentState: State<PI, PO> = { ...parentInputs };
  for (const [property, computation] of Object.entries(behavior.computations ?? {})) {
    if (!computation) {
      continue;
    }
    (parentState as Record<string, unknown>)[property] = computed(() =>
      computation({
        self: parentState,
        items: computed(() => itemsInputs().map((v) => itemStates().get(v)!)),
        inputValue: parentInputs[property]?.(),
      }),
    );
  }
  // Create a map of child inputs to child state. This allows us to maintain the same set of state
  // for a child even as it moves around in the list of items.
  const itemStates = linkedSignal<
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
          }
          return [itemInputs, itemState] as const;
        }),
      );
    },
  });
  return [parentState, itemStates] as const;
}

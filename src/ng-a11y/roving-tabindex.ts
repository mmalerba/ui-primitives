import { computed, contentChildren, Directive, inject, input, Signal } from '@angular/core';
import { applyBehavior } from '../primitives/base/behavior';
import {
  focusBehavior,
  FocusBehaviorItemInputs,
  FocusItemState,
  FocusState,
} from '../primitives/behaviors/focus/focus-behavior';

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

  state: FocusState;
  itemStates: Signal<readonly FocusItemState[]>;
  itemStatesMap: Signal<Map<FocusBehaviorItemInputs, FocusItemState>>;

  constructor() {
    const { parentState, itemStatesMap, itemStates } = applyBehavior(
      focusBehavior,
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
  }
}

@Directive({
  selector: '[rovingTabindexItem]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state().tabindex()',
  },
})
export class RovingTabindexItemDirective {
  parent = inject(RovingTabindexDirective);

  state = computed(() => this.parent.itemStatesMap().get(this));
}

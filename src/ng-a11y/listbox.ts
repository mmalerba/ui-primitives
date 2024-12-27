import {
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  Signal,
} from '@angular/core';
import { applyBehavior, composeBehavior } from '../primitives/base/behavior';
import {
  focusBehavior,
  FocusBehaviorItemInputs,
  FocusItemState,
  FocusState,
} from '../primitives/behaviors/focus/focus-behavior';
import { listNavigationBehavior } from '../primitives/behaviors/list-navigation/list-navigation-behavior';

@Directive({
  selector: '[listbox]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state.tabindex()',
  },
})
export class ListboxDirective {
  activeIndex = input.required<number>();
  wrapNavigation = computed(() => false);
  navigationSkipsDisabled = computed(() => false);
  activeElement = computed(() => this.items().at(this.activeIndex())?.element ?? null);

  items = contentChildren(ListboxOptionDirective);

  state: FocusState;
  itemStates: Signal<readonly FocusItemState[]>;
  itemStatesMap: Signal<Map<FocusBehaviorItemInputs, FocusItemState>>;

  constructor() {
    const { parentState, itemStatesMap, itemStates } = applyBehavior(
      composeBehavior(listNavigationBehavior, focusBehavior),
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
  }
}

@Directive({
  selector: '[listboxOption]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state().tabindex()',
    '[class.active]': 'state().active()',
  },
})
export class ListboxOptionDirective {
  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  parent = inject(ListboxDirective);
  disabled = input(false);

  state = computed(() => this.parent.itemStatesMap().get(this));
}

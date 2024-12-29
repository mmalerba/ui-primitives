import {
  computed,
  contentChildren,
  Directive,
  effect,
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
import { ListNavigationController } from '../primitives/behaviors/list-navigation/list-navigation-controller';

@Directive({
  selector: '[listbox]',
  standalone: true,
  host: {
    '[attr.tabindex]': 'state.tabindex()',
    '(keydown)': 'controller.keydownManager().handle($event)',
  },
})
export class ListboxDirective {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly activeIndex = input(-1);
  readonly wrapNavigation = computed(() => false);
  readonly navigationSkipsDisabled = computed(() => false);
  readonly activatedElement = computed(() => this.items()[this.activeIndex()]?.element ?? null);
  readonly orientation = computed<'horizontal' | 'vertical'>(() => 'vertical');

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: FocusState;
  readonly itemStates: Signal<readonly FocusItemState[]>;
  readonly itemStatesMap: Signal<Map<FocusBehaviorItemInputs, FocusItemState>>;
  readonly controller: ListNavigationController;

  constructor() {
    const { parentState, itemStatesMap, itemStates, syncFns } = applyBehavior(
      composeBehavior(listNavigationBehavior, focusBehavior),
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
    this.controller = new ListNavigationController(parentState, itemStates);

    for (const fn of syncFns) {
      effect(fn);
    }
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
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly parent = inject(ListboxDirective);
  readonly disabled = input(false);

  readonly state = computed(() => this.parent.itemStatesMap().get(this));
}

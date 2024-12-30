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
import { applyBehavior, composeBehavior, State } from '../primitives/base/behavior';
import {
  compositeDisabledBehavior,
  CompositeDisabledItemState,
} from '../primitives/behaviors/composite-disabled/composite-disabled-behavior';
import {
  compositeFocusBehavior,
  CompositeFocusItemState,
  CompositeFocusState,
} from '../primitives/behaviors/composite-focus/composite-focus-behavior';
import { CompositeFocusController } from '../primitives/behaviors/composite-focus/composite-focus-controller';
import {
  listNavigationBehavior,
  ListNavigationItemState,
} from '../primitives/behaviors/list-navigation/list-navigation-behavior';
import { ListNavigationController } from '../primitives/behaviors/list-navigation/list-navigation-controller';

@Directive({
  selector: '[listbox]',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'state.activeDescendantId()',
    '[attr.disabled]': 'state.compositeDisabled() || null',
    '[attr.tabindex]': 'state.tabindex()',
    '(keydown)': 'navigationController.keydownManager().handle($event)',
    '(focusout)': 'focusController.focusoutManager.handle($event)',
  },
  exportAs: 'listbox',
})
export class ListboxDirective {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly activeIndex = input(-1);
  readonly disabled = input(false);
  readonly focusStrategy = input<'activedescendant' | 'rovingtabindex'>('rovingtabindex');

  readonly wrapNavigation = computed(() => false);
  readonly navigationSkipsDisabled = computed(() => false);
  readonly activatedElement = computed(() => this.items()[this.activeIndex()]?.element ?? null);
  readonly orientation = computed<'horizontal' | 'vertical'>(() => 'vertical');

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: CompositeFocusState;
  readonly itemStates: Signal<
    readonly State<
      State<CompositeDisabledItemState, CompositeFocusItemState>,
      ListNavigationItemState
    >[]
  >;
  readonly itemStatesMap: Signal<
    Map<
      unknown,
      State<State<CompositeDisabledItemState, CompositeFocusItemState>, ListNavigationItemState>
    >
  >;
  readonly navigationController: ListNavigationController;
  readonly focusController: CompositeFocusController;

  constructor() {
    const { parentState, itemStatesMap, itemStates, syncFns } = applyBehavior(
      composeBehavior(
        compositeDisabledBehavior,
        composeBehavior(listNavigationBehavior, compositeFocusBehavior),
      ),
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
    this.navigationController = new ListNavigationController(parentState, itemStates);
    this.focusController = new CompositeFocusController(parentState, itemStates);

    for (const fn of syncFns) {
      effect(fn);
    }
  }
}

let nextId = 0;

@Directive({
  selector: '[listboxOption]',
  standalone: true,
  host: {
    '[attr.id]': 'state().id()',
    '[attr.disabled]': 'state().compositeDisabled() || null',
    '[attr.tabindex]': 'state().tabindex()',
    '[class.active]': 'state().active()',
  },
  exportAs: 'listboxOption',
})
export class ListboxOptionDirective {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly parent = inject(ListboxDirective);
  readonly disabled = input(false);
  readonly id = computed(() => `listbox-option-${nextId++}`);

  readonly state = computed(() => this.parent.itemStatesMap().get(this));
}

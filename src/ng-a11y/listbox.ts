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
  CompositeDisabledState,
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
  ListNavigationState,
} from '../primitives/behaviors/list-navigation/list-navigation-behavior';
import { ListNavigationController } from '../primitives/behaviors/list-navigation/list-navigation-controller';
import {
  getSelectionBehavior,
  SelectionItemState,
  SelectionState,
} from '../primitives/behaviors/selection/selection-behavior';
import { SelectionController } from '../primitives/behaviors/selection/selection-controller';

@Directive({
  selector: '[listbox]',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'state.activeDescendantId()',
    '[attr.disabled]': 'state.compositeDisabled() || null',
    '[attr.tabindex]': 'state.tabindex()',
    '(keydown)':
      'navigationController.keydownManager().handle($event); selectionController.keydownManager().handle($event)',
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
  readonly selectedValues = computed<number[]>(() => []);
  readonly selectionType = computed<'single' | 'multiple'>(() => 'single');
  readonly compareValues = computed<(a: number, b: number) => boolean>(() => (a, b) => a === b);

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: State<
    State<State<CompositeDisabledState, CompositeFocusState>, ListNavigationState>,
    SelectionState<number>
  >;
  readonly itemStates: Signal<
    readonly State<
      State<State<CompositeDisabledItemState, CompositeFocusItemState>, ListNavigationItemState>,
      SelectionItemState<number>
    >[]
  >;
  readonly itemStatesMap: Signal<
    Map<
      unknown,
      State<
        State<State<CompositeDisabledItemState, CompositeFocusItemState>, ListNavigationItemState>,
        SelectionItemState<number>
      >
    >
  >;
  readonly navigationController: ListNavigationController;
  readonly focusController: CompositeFocusController;
  readonly selectionController: SelectionController<number>;

  constructor() {
    const { parentState, itemStatesMap, itemStates, syncFns } = applyBehavior(
      composeBehavior(
        composeBehavior(
          compositeDisabledBehavior,
          composeBehavior(listNavigationBehavior, compositeFocusBehavior),
        ),
        getSelectionBehavior<number>(),
      ),
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
    this.navigationController = new ListNavigationController(parentState, itemStates);
    this.focusController = new CompositeFocusController(parentState, itemStates);
    this.selectionController = new SelectionController<number>(parentState, itemStates);

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
    '[attr.aria-selected]': 'state().selected()',
    '[attr.disabled]': 'state().compositeDisabled() || null',
    '[attr.id]': 'state().id()',
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
  readonly value = computed(() => this.parent.items().indexOf(this));

  readonly state = computed(() => this.parent.itemStatesMap().get(this));
}

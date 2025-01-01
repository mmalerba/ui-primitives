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
import { createState } from '../primitives/base/state';
import {
  CompositeDisabledItemState,
  CompositeDisabledState,
} from '../primitives/composables/composite-disabled/composite-disabled-state';
import { CompositeFocusController } from '../primitives/composables/composite-focus/composite-focus-controller';
import {
  CompositeFocusItemState,
  CompositeFocusState,
} from '../primitives/composables/composite-focus/composite-focus-state';
import { ListNavigationController } from '../primitives/composables/list-navigation/list-navigation-controller';
import {
  ListNavigationItemState,
  ListNavigationState,
} from '../primitives/composables/list-navigation/list-navigation-state';
import { getListboxSchema } from '../primitives/composables/listbox/listbox-state';
import { SelectionController } from '../primitives/composables/selection/selection-controller';
import {
  SelectionItemState,
  SelectionState,
} from '../primitives/composables/selection/selection-state';

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
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');

  readonly wrapNavigation = computed(() => false);
  readonly navigationSkipsDisabled = computed(() => false);
  readonly activatedElement = computed(() => this.items()[this.activeIndex()]?.element ?? null);
  readonly selectedValues = computed<number[]>(() => []);
  readonly selectionType = computed<'single' | 'multiple'>(() => 'single');
  readonly compareValues = computed<(a: number, b: number) => boolean>(() => (a, b) => a === b);

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: CompositeDisabledState &
    CompositeFocusState &
    ListNavigationState &
    SelectionState<number>;
  readonly itemStates: Signal<
    readonly (CompositeDisabledItemState &
      CompositeFocusItemState &
      ListNavigationItemState &
      SelectionItemState<number>)[]
  >;
  readonly itemStatesMap: Signal<
    Map<
      unknown,
      CompositeDisabledItemState &
        CompositeFocusItemState &
        ListNavigationItemState &
        SelectionItemState<number>
    >
  >;
  readonly navigationController: ListNavigationController;
  readonly focusController: CompositeFocusController;
  readonly selectionController: SelectionController<number>;

  constructor() {
    const { parentState, itemStatesMap, itemStates, syncFns } = createState(
      getListboxSchema<number>(),
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

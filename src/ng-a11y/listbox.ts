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
import { ListboxController } from '../primitives/composables/listbox/listbox-controller';
import {
  getListboxSchema,
  ListboxOptionInputs,
  ListboxOptionState,
  ListboxState,
} from '../primitives/composables/listbox/listbox-state';

@Directive({
  selector: '[listbox]',
  standalone: true,
  host: {
    '[attr.aria-activedescendant]': 'state.activeDescendantId()',
    '[attr.disabled]': 'state.compositeDisabled() || null',
    '[attr.tabindex]': 'state.tabindex()',
    '(click)': 'listboxController.handlers.click($event)',
    '(keydown)': 'listboxController.handlers.keydown($event)',
    '(focusout)': 'listboxController.handlers.focusout($event)',
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
  readonly selectionStrategy = computed<'followfocus' | 'explicit'>(() => 'followfocus');
  readonly compareValues = computed<(a: number, b: number) => boolean>(() => (a, b) => a === b);

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: ListboxState<number>;
  readonly itemStates: Signal<readonly ListboxOptionState<number>[]>;
  readonly itemStatesMap: Signal<Map<ListboxOptionInputs<number>, ListboxOptionState<number>>>;
  readonly listboxController: ListboxController;

  constructor() {
    const { parentState, itemStatesMap, itemStates, syncFns } = createState(
      getListboxSchema<number>(),
      this,
      this.items,
    );
    this.state = parentState;
    this.itemStatesMap = itemStatesMap;
    this.itemStates = itemStates;
    this.listboxController = new ListboxController(parentState, itemStates);

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

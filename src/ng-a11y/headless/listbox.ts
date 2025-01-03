import {
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  Signal,
} from '@angular/core';
import { createState } from '../../primitives/base/state';
import {
  ListboxOptionInputs,
  ListboxOptionState,
  ListboxState,
  listboxStateSchema,
} from '../../primitives/composables/listbox/listbox-state';
import { BindListboxOptionState, BindListboxState } from '../bindings/listbox';

@Directive({
  selector: '[listbox]',
  exportAs: 'listbox',
  hostDirectives: [BindListboxState],
})
export class ListboxDirective {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly activeIndex = input(-1);
  readonly disabled = input(false);
  readonly focusStrategy = input<'activedescendant' | 'rovingtabindex'>('rovingtabindex');
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly selectionType = input<'single' | 'multiple'>('single');
  readonly selectionStrategy = input<'followfocus' | 'explicit'>('followfocus');
  readonly wrapNavigation = input(false);

  readonly activatedElement = computed(() => this.items()[this.activeIndex()]?.element ?? null);
  readonly selectedValues = computed(() => new Set<number>());
  readonly compareValues = computed(() => (a: number, b: number) => a === b);

  readonly items = contentChildren(ListboxOptionDirective);

  readonly state: ListboxState<number>;
  readonly itemStatesMap: Signal<Map<ListboxOptionInputs<number>, ListboxOptionState<number>>>;

  constructor() {
    const instanceState = createState(listboxStateSchema<number>(), this, this.items);

    this.state = instanceState.parentState;
    this.itemStatesMap = instanceState.itemStatesMap;

    const options = computed(() => ({ wrapNavigation: this.wrapNavigation() }));

    BindListboxState.bindHost({ ...instanceState, options });
  }
}

let nextId = 0;

@Directive({
  selector: '[listboxOption]',
  exportAs: 'listboxOption',
  hostDirectives: [BindListboxOptionState],
})
export class ListboxOptionDirective {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly parent = inject(ListboxDirective);
  readonly disabled = input(false);
  readonly id = computed(() => `listbox-option-${nextId++}`);
  readonly value = computed(() => this.parent.items().indexOf(this));

  readonly state = computed(() => this.parent.itemStatesMap().get(this)!);

  constructor() {
    BindListboxOptionState.bindHost({ state: this.state });
  }
}

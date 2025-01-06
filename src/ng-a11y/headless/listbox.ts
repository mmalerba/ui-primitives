import {
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  runInInjectionContext,
} from '@angular/core';
import { createState, InstanceState } from '../../primitives/base/state';
import { FocusStrategy } from '../../primitives/composables/composite-focus/composite-focus-state';
import { Orientation } from '../../primitives/composables/list-navigation/list-navigation-state';
import {
  ListboxOptionInputs,
  ListboxStateSchema,
  listboxStateSchema,
} from '../../primitives/composables/listbox/listbox-state';
import {
  SelectionStrategy,
  SelectionType,
} from '../../primitives/composables/selection/selection-state';
import { BindListboxOptionState, BindListboxState } from '../bindings/listbox';

@Directive({
  selector: '[listbox]',
  exportAs: 'listbox',
  hostDirectives: [BindListboxState],
})
export class ListboxDirective<T> {
  // Inputs
  readonly inputActiveIndex = input(-1, { alias: 'activeIndex' });
  readonly inputDisabled = input(false, { alias: 'disabled' });
  readonly inputFocusStrategy = input<FocusStrategy>('rovingtabindex', { alias: 'focusStrategy' });
  readonly inputOrientation = input<Orientation>('vertical', { alias: 'orientation' });
  readonly inputSelectionType = input<SelectionType>('single', { alias: 'selectionType' });
  readonly inputSelectionStrategy = input<SelectionStrategy>('followfocus', {
    alias: 'selectionStrategy',
  });
  readonly inputWrapNavigation = input(false, { alias: 'wrapNavigation' });
  readonly inputSelectedValues = input<T[]>([], { alias: 'selectedValues' });

  // Child options
  readonly options = contentChildren(ListboxOptionDirective<T>);

  // Listbox instance state
  listboxState!: InstanceState<ListboxStateSchema<T>, HTMLElement>;

  // TODO: expose relevant properties, outputs, etc based on the state.

  private injector = inject(Injector);

  ngAfterViewInit() {
    runInInjectionContext(this.injector, () => {
      this.listboxState = createState(
        listboxStateSchema<T>(),
        {
          element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
          explicitDisabled: this.inputDisabled,
          activatedElement: computed(
            () => this.options()[this.inputActiveIndex()]?.stateInputs.element ?? null,
          ),
          orientation: this.inputOrientation,
          focusStrategy: this.inputFocusStrategy,
          selectionStrategy: this.inputSelectionStrategy,
          selectionType: this.inputSelectionType,
          selectedValues: computed(() => new Set<T>(this.inputSelectedValues())),
          compareValues: computed(() => (a: T, b: T) => a === b),
        },
        computed(() => this.options().map((option) => option.stateInputs)),
        (o) => o.element,
      );

      BindListboxState.bindHost({
        ...this.listboxState,
        options: computed(() => ({ wrapNavigation: this.inputWrapNavigation() })),
      });
    });
  }
}

let nextId = 0;

@Directive({
  selector: '[listboxOption]',
  exportAs: 'listboxOption',
  hostDirectives: [BindListboxOptionState],
})
export class ListboxOptionDirective<T> {
  // Inputs
  readonly inputDisabled = input(false, { alias: 'disabled' });
  readonly inputValue = input.required<T>({ alias: 'value' });

  readonly stateInputs: ListboxOptionInputs<T> = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    explicitDisabled: this.inputDisabled,
    id: computed(() => `listbox-option-${nextId++}`),
    value: this.inputValue,
  };

  // Owning listbox
  readonly parent = inject(ListboxDirective);

  // TODO: expose relevant properties, outputs, etc based on the state.

  private injector = inject(Injector);

  ngAfterViewInit() {
    runInInjectionContext(this.injector, () => {
      BindListboxOptionState.bindHost({
        state: computed(
          () => this.parent.listboxState.itemStatesMap().get(this.stateInputs.element)!,
        ),
      });
    });
  }
}

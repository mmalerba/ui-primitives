import {
  afterNextRender,
  computed,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { ActiveDescendantFocusBehavior } from '../behaviors/active-descendant-focus';
import { createUiState, derivedSignal, EventDispatcher } from '../behaviors/base';
import { ListNavigationBehavior } from '../behaviors/list-navigation';

export interface ListboxOptions {
  wrapKeyNavigation: boolean;
  useActiveDescendant: boolean;
  selectionFollowsFocus: boolean;
  multiple: boolean;
}

export const DEFAULT_LISTBOX_OPTIONS: ListboxOptions = {
  wrapKeyNavigation: false,
  useActiveDescendant: true,
  selectionFollowsFocus: true,
  multiple: false,
};

let nextId = 0;

@Directive({
  selector: '[tbd-listbox-option]',
  standalone: true,
  exportAs: 'ListboxOption',
  host: {
    role: 'option',
    '[id]': 'uiState.id()',
    '[attr.disabled]': 'uiState.disabled()',
    '[attr.tabindex]': 'uiState.tabindex()',
    '[attr.aria-selected]': 'uiState.selected()',
    '[class.active]': 'uiState.active()',
  },
})
export class ListboxOption {
  private readonly listbox = inject(Listbox);

  // Declare our inputs.
  readonly disabled = input(false);
  readonly id = input<string>(`tbd-listbox-option-${nextId++}`);

  // Set up our internal state.
  readonly uiState = createUiState({
    identity: this as ListboxOption,
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    disabled: this.disabled,
    tabindex: signal<number | undefined>(undefined),
    id: this.id,
    active: computed((): boolean => this.listbox.uiState.active() === this),
    selected: computed((): boolean => this.listbox.uiState.selected() === this),
  });
}

@Directive({
  selector: '[tbd-listbox]',
  standalone: true,
  exportAs: 'Listbox',
  host: {
    role: 'listbox',
    '[tabindex]': 'uiState.tabindex()',
    '[attr.disabled]': 'uiState.disabled()',
    '[attr.aria-orientation]': 'uiState.orientation()',
    '[attr.aria-activedescendant]': 'uiState.activeDescendantId()',
    '(keydown)': 'uiState.keydownEvents.dispatch($event)',
    '(focusin)': 'uiState.focusinEvents.dispatch($event)',
    '(focusout)': 'uiState.focusoutEvents.dispatch($event)',
  },
})
export class Listbox {
  private readonly injector = inject(Injector);

  // Declare our inputs.
  readonly options = input<Partial<ListboxOptions>>({});
  readonly disabled = input(false);
  readonly active = input<ListboxOption | undefined>(undefined);
  readonly selected = input<ListboxOption | undefined>(undefined);
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
  readonly directionality = input<'ltr' | 'rtl'>('ltr');
  readonly items = contentChildren(ListboxOption);

  // Set up our internal state.
  private readonly disabledByState = signal(false);
  readonly uiState = createUiState({
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    disabledByState: this.disabledByState,
    disabled: computed(() => this.disabled() || this.disabledByState()),
    tabindex: signal<number | undefined>(undefined),
    active: derivedSignal<ListboxOption | undefined>(() => this.active()),
    selected: derivedSignal<ListboxOption | undefined>(() => this.selected()),
    activeDescendantId: signal<string | undefined>(undefined),
    orientation: this.orientation,
    direction: this.directionality,
    items: computed(() => this.items().map((item) => item.uiState)),
    focused: signal<HTMLElement | undefined>(undefined),
    keydownEvents: new EventDispatcher<KeyboardEvent>(),
    focusinEvents: new EventDispatcher<FocusEvent>(),
    focusoutEvents: new EventDispatcher<FocusEvent>(),
  });

  // Attach behaviors to the state.
  private readonly navigationBehavior = computed(
    () =>
      new ListNavigationBehavior(this.uiState, {
        wrap: this.options().wrapKeyNavigation,
      })
  );
  private readonly focusBehavior = computed(
    () =>
      //this.options().useActiveDescendant
      //  ?
      new ActiveDescendantFocusBehavior(this.uiState)
    //  : new RovingTabindexFocusBehavior(this.uiState)
  ); /*
  private readonly selectionBehavior = computed(() =>
    this.options().selectionFollowsFocus
      ? new ListFollowFocusSelectionBehavior(this.uiState)
      : new ListExplicitSelectionBehavior(this.uiState)
  );*/

  constructor() {
    effect(() => {
      this.uiState.focused();
      afterNextRender(() => this.uiState.focused()?.focus(), { injector: this.injector });
    });

    // Clean up our behaviors when they change.
    effect((onCleanup) => {
      const behavior = this.navigationBehavior();
      onCleanup(() => behavior.remove());
    });
    effect((onCleanup) => {
      const behavior = this.focusBehavior();
      onCleanup(() => behavior.remove());
    }); /*
    effect((onCleanup) => {
      const behavior = this.selectionBehavior();
      onCleanup(() => behavior.remove());
    });*/
  }
}

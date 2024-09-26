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
import { EventDispatcher } from '../base/event-dispatcher-2';
import { applyDynamicStateMachine, compose } from '../base/state-machine';
import { getActiveDescendantStateMachine } from '../behaviors2/active-descendant';
import { getListNavigationStateMachine } from '../behaviors2/list-navigation';

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
    '[id]': 'uiState().id()',
    '[attr.disabled]': 'uiState().disabled()',
    '[attr.tabindex]': 'uiState().tabindex()',
    '[attr.aria-selected]': 'uiState().selected()',
    '[class.active]': 'uiState().active()',
  },
})
export class ListboxOption {
  private readonly listbox = inject(Listbox);

  // Declare our inputs.
  readonly disabled = input(false);
  readonly id = input<string>(`tbd-listbox-option-${nextId++}`);

  // Set up our internal state.
  readonly inputState = {
    identity: this as ListboxOption,
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,

    tabindex: signal<number | undefined>(undefined),

    disabled: this.disabled,
    id: this.id,
  };

  readonly uiState = computed(() => ({
    ...this.listbox
      .uiState()
      .items()
      .find((i) => i.identity === this.inputState.identity),
    active: computed(() => this.listbox.uiState().active() === this.inputState.identity),
    selected: computed(() => this.listbox.uiState().selected() === this.inputState.identity),
  }));
}

@Directive({
  selector: '[tbd-listbox]',
  standalone: true,
  exportAs: 'Listbox',
  host: {
    role: 'listbox',
    '[tabindex]': 'uiState().tabindex()',
    '[attr.disabled]': 'uiState().disabled()',
    '[attr.aria-orientation]': 'uiState().orientation()',
    '[attr.aria-activedescendant]': 'uiState().activeDescendantId()',
    '(keydown)': 'dispatchers.keydown.dispatch($event)',
    '(focusin)': 'dispatchers.focusin.dispatch($event)',
    '(focusout)': 'dispatchers.focusout.dispatch($event)',
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

  // Set up the input state for our state machine.
  private readonly inputState = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,

    active: this.active,
    activated: signal(undefined),
    tabindex: signal<0 | -1>(-1),
    focused: signal<HTMLElement | undefined>(undefined),
    activeDescendantId: signal<string | undefined>(undefined),
    items: computed(() => this.items().map((item) => item.inputState)),
    disabled: this.disabled,
    selected: this.selected,

    orientation: this.orientation,
    direction: this.directionality,
  };

  readonly dispatchers = {
    keydown: new EventDispatcher<KeyboardEvent>(),
    focusin: new EventDispatcher<FocusEvent>(),
    focusout: new EventDispatcher<FocusEvent>(),
  };

  // Create our state machine.
  private readonly machine = computed(() =>
    compose(
      getListNavigationStateMachine({ wrap: !!this.options().wrapKeyNavigation }),
      getActiveDescendantStateMachine()
    )
  );

  // Run the state through the machine.
  readonly uiState = applyDynamicStateMachine(this.inputState, this.machine, this.dispatchers);

  constructor() {
    // Sync the focused state to the DOM.
    effect(() => {
      this.uiState().focused();
      afterNextRender(() => this.uiState().focused()?.focus(), { injector: this.injector });
    });
  }
}

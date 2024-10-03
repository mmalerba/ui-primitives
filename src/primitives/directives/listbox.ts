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
import { applyDynamicBehavior, compose } from '../base/behavior';
import { EventDispatcher } from '../base/event-dispatcher';
import { linkedSignal } from '../base/linked-signal';
import { getActiveDescendantBehavior } from '../behaviors/active-descendant';
import { getListNavigationBehavior } from '../behaviors/list-navigation';
import { getRovingTabindexBehavior } from '../behaviors/roving-tabindex';
import { getSelectionFollowsFocusBehavior } from '../behaviors/selection-follows-focus';
import { getSelectionOnCommitBehavior } from '../behaviors/selection-on-commit';

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
      .find((i) => i.identity === this),
    active: computed(() => this.listbox.uiState().active() === this),
    selected: computed(() => this.listbox.uiState().selected() === this),
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
    tabindex: computed<0 | -1>(() => -1),
    focused: computed<[HTMLElement | undefined]>(() => [undefined]),
    activeDescendantId: computed<string | undefined>(() => undefined),
    items: computed(() => this.items().map((item) => item.inputState)),
    active: this.active,
    disabled: this.disabled,
    orientation: this.orientation,
    direction: this.directionality,

    activated: signal(undefined),
    hasFocus: signal(false),
    selected: linkedSignal(this.selected),
  };

  readonly dispatchers = {
    keydown: new EventDispatcher<KeyboardEvent>(),
    focusin: new EventDispatcher<FocusEvent>(),
    focusout: new EventDispatcher<FocusEvent>(),
  };

  // Create our state machine.
  private readonly behavior = computed(() =>
    compose(
      getListNavigationBehavior({ wrap: !!this.options().wrapKeyNavigation }),
      this.options().useActiveDescendant
        ? getActiveDescendantBehavior()
        : getRovingTabindexBehavior(),
      this.options().selectionFollowsFocus
        ? getSelectionFollowsFocusBehavior()
        : getSelectionOnCommitBehavior()
    )
  );

  // Run the state through the machine.
  readonly uiState = applyDynamicBehavior(this.inputState, this.behavior, this.dispatchers);

  constructor() {
    // Sync the focused state to the DOM.
    effect(() => {
      const [focused] = this.uiState().focused();
      afterNextRender(() => focused?.focus(), { injector: this.injector });
    });
  }
}

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
} from '@angular/core';
import { EventDispatcher } from '../base/event-dispatcher';
import { patchableSignal } from '../base/patchable-signal';
import { ActiveDescendantFocusBehavior } from '../behaviors/active-descendant-focus';
import { ListExplicitSelectionBehavior } from '../behaviors/list-explicit-selection';
import { ListFollowFocusSelectionBehavior } from '../behaviors/list-follow-focus-selection';
import { ListNavigationBehavior } from '../behaviors/list-navigation';
import { RovingTabindexFocusBehavior } from '../behaviors/roving-tabindex-focus';

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
    '[attr.aria-selected]': 'listbox.uiState.selected() === this',
    '[class.active]': 'listbox.uiState.active() === this',
  },
})
export class ListboxOption {
  private readonly listbox = inject(Listbox);

  // Declare our inputs.
  readonly disabled = input(false);
  readonly id = input<string>(`tbd-listbox-option-${nextId++}`);

  // Set up our internal state.
  readonly uiState = {
    identity: this as ListboxOption,
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,

    tabindex: patchableSignal<number | undefined>(() => undefined),

    disabled: this.disabled,
    id: this.id,
  };
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
  readonly uiState = {
    element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,

    active: patchableSignal(this.active),
    activated: patchableSignal<ListboxOption | undefined>(() => undefined),
    tabindex: patchableSignal<number | undefined>(() => undefined),
    focused: patchableSignal<{ element: HTMLElement } | undefined>(() => undefined),
    activeDescendantId: patchableSignal<string | undefined>(() => undefined),
    items: patchableSignal(computed(() => this.items().map((item) => item.uiState))),
    disabled: patchableSignal(this.disabled),
    selected: patchableSignal(this.selected),

    orientation: this.orientation,
    direction: this.directionality,

    keydownEvents: new EventDispatcher<KeyboardEvent>(),
    focusinEvents: new EventDispatcher<FocusEvent>(),
    focusoutEvents: new EventDispatcher<FocusEvent>(),
  };

  // Create behaviors based on the selected options.
  private readonly behaviors = computed(() => [
    new ListNavigationBehavior(this.uiState, {
      wrap: this.options().wrapKeyNavigation,
    }),
    this.options().useActiveDescendant
      ? new ActiveDescendantFocusBehavior(this.uiState)
      : new RovingTabindexFocusBehavior(this.uiState),
    this.options().selectionFollowsFocus
      ? new ListFollowFocusSelectionBehavior(this.uiState)
      : new ListExplicitSelectionBehavior(this.uiState),
  ]);

  constructor() {
    // Connect / disconnect the active behaviors.
    effect((onCleanup) => {
      const behaviors = this.behaviors();
      for (const behavior of behaviors) {
        behavior.connect();
      }
      onCleanup(() => {
        for (const behavior of behaviors) {
          behavior.disconnect();
        }
      });
    });

    // Sync the focused state to the DOM.
    effect(() => {
      this.uiState.focused();
      afterNextRender(() => this.uiState.focused()?.element.focus(), { injector: this.injector });
    });
  }
}

import { computed, Directive, inject, input, Signal, signal } from '@angular/core';
import { InstanceState } from '../../primitives/base/state';
import {
  ListboxController,
  ListboxControllerOptions,
} from '../../primitives/composables/listbox/listbox-controller';
import {
  ListboxOptionState,
  ListboxStateSchema,
} from '../../primitives/composables/listbox/listbox-state';
import { runSyncFns } from './base';

export interface ListboxBinding<T> extends InstanceState<ListboxStateSchema<T>> {
  options: Signal<ListboxControllerOptions>;
}

export interface ListboxOptionBinding<T> {
  state: Signal<ListboxOptionState<T>>;
}

@Directive({
  selector: '[bindListboxState]',
  host: {
    '[attr.role]': 'state() ? "listbox" : null',
    '[attr.aria-activedescendant]': 'state()?.activeDescendantId()',
    '[attr.disabled]': 'state()?.compositeDisabled() || null',
    '[attr.tabindex]': 'state()?.tabindex()',
    '(click)': 'controller()?.handlers.click($event)',
    '(keydown)': 'controller()?.handlers.keydown($event)',
    '(focusout)': 'controller()?.handlers.focusout($event)',
  },
})
export class BindListboxState<T> {
  bindingInput = input<ListboxBinding<T> | undefined>(undefined, {
    alias: 'bindListboxState',
  });
  bindingSignal = signal<ListboxBinding<T> | undefined>(undefined);
  binding = computed(() => this.bindingInput() ?? this.bindingSignal());
  state = computed(() => this.binding()?.parentState);
  controller = computed(() => {
    const state = this.binding();
    if (state) {
      return new ListboxController(state.parentState, state.itemStates, state.options);
    }
    return undefined;
  });

  constructor() {
    runSyncFns(this.binding);
  }

  static bindHost<T>(binding: ListboxBinding<T>) {
    inject(BindListboxState, { self: true }).bindingSignal.set(binding);
  }
}

@Directive({
  selector: '[bindListboxOptionState]',
  host: {
    '[attr.role]': 'state() ? "option" : null',
    '[attr.aria-selected]': 'state()?.selected()',
    '[attr.disabled]': 'state()?.compositeDisabled() || null',
    '[attr.id]': 'state()?.id()',
    '[attr.tabindex]': 'state()?.tabindex()',
    '[class.active]': 'state()?.active()',
  },
})
export class BindListboxOptionState<T> {
  bindingInput = input<ListboxOptionBinding<T> | undefined>(undefined, {
    alias: 'bindListboxOptionState',
  });
  bindingSignal = signal<ListboxOptionBinding<T> | undefined>(undefined);
  binding = computed(() => this.bindingInput() ?? this.bindingSignal());
  state = computed(() => this.binding()?.state());

  static bindHost<T>(binding: ListboxOptionBinding<T>) {
    inject(BindListboxOptionState, { self: true }).bindingSignal.set(binding);
  }
}

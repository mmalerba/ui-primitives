import { computed, contentChildren, Directive, ElementRef, inject, input, model } from '@angular/core';
import { createListbox, createListboxOption } from './builders';
import { handleKeyDown } from './setters';

@Directive({
  selector: '[uiListbox]',
  standalone: true,
  exportAs: 'uiListbox',
  host: {
    role: 'listbox',
    '(keydown)': 'onKeyDown($event)',
    '[attr.tabindex]': 'props.tabindex()',
    '[attr.aria-activedescendant]': 'props.activeId()',
  },
})
export class uiListbox {
  uiListboxOptions = contentChildren(uiListboxOption);
  options = computed(() => this.uiListboxOptions().map((option) => option.props));
  rovingFocus = input(false);
  followFocus = input(false);

  props = createListbox(this.options, this);

  onKeyDown(event: KeyboardEvent) {
    handleKeyDown(event, this.props);
  }
}

@Directive({
  selector: '[uiListboxOption]',
  standalone: true,
  exportAs: 'uiListboxOption',
  host: {
    role: 'option',
    '[attr.id]': 'props.id()',
    '[attr.disabled]': 'props.disabled()',
    '[attr.tabindex]': 'props.tabindex()',
    '[attr.aria-selected]': 'props.selected()',
  },
})
export class uiListboxOption {
  listbox = inject(uiListbox);
  host = inject(ElementRef).nativeElement;
  focus = () => this.host.focus();
  props = createListboxOption(this.listbox.props, this);
}

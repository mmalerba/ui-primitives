import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { Listbox, ListboxOption } from '../../primitives/directives/listbox';

let nextItem = 0;

@Component({
  selector: 'listbox-demo',
  templateUrl: 'listbox-demo.html',
  styleUrl: 'listbox-demo.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Listbox, ListboxOption],
  host: {
    '(document:keydown)': 'handleKeydown($event)',
  },
})
export class ListboxDemo {
  wrap = signal(false);
  useActiveDescendant = signal(true);
  selectionFollowsFocus = signal(true);
  multiple = signal(false);
  options = computed(() => ({
    wrapKeyNavigation: this.wrap(),
    useActiveDescendant: this.useActiveDescendant(),
    selectionFollowsFocus: this.selectionFollowsFocus(),
    multiple: this.multiple(),
  }));
  items = signal(Array.from({ length: 10 }, (_, i) => `item-${i}`));
  listbox = viewChild.required(Listbox);
  disabled = signal<Set<ListboxOption>>(new Set());

  handleKeydown(event: KeyboardEvent) {
    const active = this.listbox().uiState.active();
    switch (event.key) {
      case 'f':
        this.useActiveDescendant.update((useActiveDescendant) => !useActiveDescendant);
        break;
      case 'w':
        this.wrap.update((wrap) => !wrap);
        break;
      case 'm':
        this.multiple.update((multiple) => !multiple);
        break;
      case 's':
        this.selectionFollowsFocus.update((selectionFollowsFocus) => !selectionFollowsFocus);
        break;
      case 'r':
        if (active) {
          this.items.update((items) => {
            items.splice(this.listbox().items().indexOf(active), 1);
            return [...items];
          });
        }
        break;
      case 'd':
        if (active) {
          this.disabled.update((disabled) => {
            disabled.has(active) ? disabled.delete(active) : disabled.add(active);
            return new Set(disabled);
          });
        }
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (event.ctrlKey) {
          this.items.update((items) => {
            items.splice(Number(event.key), 1);
            return [...items];
          });
        } else {
          this.items.update((items) => {
            items.splice(Number(event.key), 0, `added-item-${nextItem++}`);
            return [...items];
          });
        }
        break;
    }
  }
}

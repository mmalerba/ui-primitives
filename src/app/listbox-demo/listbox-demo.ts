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
  options = computed(() => ({
    wrapKeyNavigation: this.wrap(),
    useActiveDescendant: this.useActiveDescendant(),
    selectionFollowsFocus: this.selectionFollowsFocus(),
  }));
  items = signal(Array.from({ length: 10 }, (_, i) => `item-${nextItem++}`));
  listbox = viewChild.required(Listbox);
  disabled = signal<Set<ListboxOption>>(new Set());
  overallDisabled = signal(false);
  cmd = signal('');
  cmdIndex = computed(() => (this.cmd() ? Number(this.cmd()) : null));

  handleKeydown(event: KeyboardEvent) {
    const active = this.listbox().uiState().active();
    const cmdIndex = this.cmdIndex() ?? (active ? this.listbox().items().indexOf(active) : null);
    switch (event.key) {
      case 'f':
        this.useActiveDescendant.update((useActiveDescendant) => !useActiveDescendant);
        break;
      case 'w':
        this.wrap.update((wrap) => !wrap);
        break;
      case 's':
        this.selectionFollowsFocus.update((selectionFollowsFocus) => !selectionFollowsFocus);
        break;
      case 'o':
        this.overallDisabled.update((compositeDisabled) => !compositeDisabled);
        break;
      case 'a':
        if (cmdIndex !== null) {
          this.items.update((items) => {
            items.splice(cmdIndex, 0, `added-item-${nextItem++}`);
            return [...items];
          });
        }
        break;
      case 'r':
        if (cmdIndex !== null) {
          this.items.update((items) => {
            items.splice(cmdIndex, 1);
            return [...items];
          });
        }
        break;
      case 'd':
        if (cmdIndex !== null) {
          this.disabled.update((disabled) => {
            const item = this.listbox().items()[cmdIndex];
            disabled.has(item) ? disabled.delete(item) : disabled.add(item);
            return new Set(disabled);
          });
        }
        break;
      case 'c':
        this.cmd.set('');
        break;
      case 'Backspace':
        this.cmd.update((cmd) => cmd.slice(0, -1));
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
        this.cmd.update((cmd) => cmd + event.key);
        break;
    }
  }
}

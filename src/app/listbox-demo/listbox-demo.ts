import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '../../ng-a11y/listbox';
import { DemoControls } from '../demo-controls/demo-controls';

let nextId = 10;

@Component({
  selector: 'listbox-demo',
  templateUrl: 'listbox-demo.html',
  styleUrl: 'listbox-demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListboxDirective, ListboxOptionDirective, DemoControls],
})
export class ListboxDemo {
  items = signal(Array.from({ length: nextId }, (_, i) => i));

  disabled = signal(false);
  disabledItems = signal(new Set<number>(), { equal: () => false });

  listbox = viewChild.required(ListboxDirective);
  controls = viewChild.required(DemoControls);

  commandTarget = computed<number | 'l' | undefined>(() =>
    this.getTarget(this.controls().command()),
  );

  commands = [
    {
      name: '[l, a, {idx}]',
      description: 'Prefix to target command at list, active item, or item at given index',
      match: () => false,
      run: () => {},
    },
    {
      name: 'd',
      description: 'Toggle disabled state of the target element',
      match: /^(l|a|\d+)d$/i,
      run: () => {
        const target = this.commandTarget();
        if (target === 'l') {
          this.disabled.set(!this.disabled());
          return;
        } else if (typeof target === 'number') {
          const item = this.items()[target];
          if (this.disabledItems().has(item)) {
            this.disabledItems().delete(item);
          } else {
            this.disabledItems().add(item);
          }
          this.disabledItems.update((s) => s);
        }
      },
    },
    {
      name: 'a',
      description: 'Add an item before the target item',
      match: /^(l|a|\d+)a$/i,
      run: () => {
        const target = this.commandTarget();
        if (typeof target !== 'number') {
          return;
        }
        this.items.update((items) => [...items.slice(0, target), nextId++, ...items.slice(target)]);
      },
    },
    {
      name: 'r',
      description: 'Remove the target item',
      match: /^(l|a|\d+)r$/i,
      run: () => {
        const target = this.commandTarget();
        if (typeof target !== 'number') {
          return;
        }
        this.items().splice(target, 1);
        this.items.update((items) => items);
      },
    },
  ];

  private getTarget(command: string) {
    const match = command.match(/^(l|a|\d+)/i);
    if (match?.[0] === 'l') {
      return 'l';
    }
    if (match?.[0] === 'a') {
      return this.listbox().state.activeIndex();
    }
    return match ? Math.min(this.items().length - 1, Number(match?.[0])) : undefined;
  }
}

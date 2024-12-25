import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  RovingTabindexDirective,
  RovingTabindexItemDirective,
} from '../../primitives/directives/roving-tabindex';

let nextItem = 0;

@Component({
  selector: 'listbox-demo',
  templateUrl: 'listbox-demo.html',
  styleUrl: 'listbox-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RovingTabindexDirective, RovingTabindexItemDirective],
})
export class ListboxDemo {
  activeIndex = signal(0);

  items = signal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  toggleExtra() {
    const idx = this.items().indexOf(5.5);
    if (idx === -1) {
      this.items().splice(5, 0, 5.5);
    } else {
      this.items().splice(idx, 1);
    }
    this.items.set([...this.items()]);
  }
}

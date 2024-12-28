import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '../../ng-a11y/listbox';

@Component({
  selector: 'listbox-demo',
  templateUrl: 'listbox-demo.html',
  styleUrl: 'listbox-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListboxDirective, ListboxOptionDirective],
})
export class ListboxDemo {
  items = signal([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  activeIndex = signal(-1);

  toggleExtra() {
    const idx = this.items().indexOf(5.5);
    if (idx === -1) {
      this.items().splice(5, 0, 5.5);
    } else {
      this.items().splice(idx, 1);
    }
    this.items.set([...this.items()]);
  }

  rnd() {
    this.activeIndex.set(Math.floor(Math.random() * 10));
  }
}

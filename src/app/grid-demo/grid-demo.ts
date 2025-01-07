import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  viewChildren,
} from '@angular/core';
import { createState } from '../../primitives/base/state';
import { tableStateSchema } from '../../primitives/composables/table/table-state';

@Directive({
  selector: 'tr',
})
export class Row {
  cells = contentChildren(Cell);
}

@Component({
  selector: 'td',
  host: {
    '[attr.rowspan]': 'rowspan()',
    '[attr.colspan]': 'colspan()',
  },
  template: `index: {{ state().index() }}<br />position: {{ state().position().row }},
    {{ state().position().column }}`,
})
export class Cell {
  demo = inject<GridDemo>(GridDemo);
  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  rowspan = input(1);
  colspan = input(1);
  state = computed(() => this.demo.gridState.itemStatesMap().get(this)!);
}

@Component({
  selector: 'grid-demo',
  templateUrl: './grid-demo.html',
  styleUrl: './grid-demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Row, Cell],
})
export default class GridDemo {
  rows = viewChildren(Row);
  items = computed(() => this.rows().flatMap((row) => row.cells()));
  rowcount = computed(() => this.rows().length);
  colcount = computed(
    () =>
      this.rows()[0]
        ?.cells()
        .reduce((acc, c) => acc + c.colspan(), 0) ?? 0,
  );
  gridState = createState(tableStateSchema(), this, this.items);
}

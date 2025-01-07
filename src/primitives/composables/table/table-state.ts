import { Signal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema } from '../../base/state';

export type TablePosition = {
  readonly row: number;
  readonly column: number;
};

export type CellIndex = {
  readonly position: (idx: number) => TablePosition;
  readonly index: (pos: TablePosition) => number;
};

export type TableInputs = {
  readonly rowcount: Signal<number>;
  readonly colcount: Signal<number>;
};

export type TableCellInputs = {
  readonly element: HTMLElement;
  readonly rowspan: Signal<number>;
  readonly colspan: Signal<number>;
};

export type TableOutputs = {
  readonly cellIndex: Signal<CellIndex>;
};

export type TableCellOutputs = {
  readonly index: Signal<number>;
  readonly position: Signal<TablePosition>;
};

export type TableStateSchema = StateSchema<
  TableInputs,
  TableCellInputs,
  TableOutputs,
  TableCellOutputs
>;

export type TableState = ParentStateType<TableStateSchema>;

export type TableCellState = ItemStateType<TableStateSchema>;

export function tableStateSchema(): TableStateSchema {
  return schema;
}

const schema: TableStateSchema = {
  computations: {
    parent: {
      cellIndex: ({ self, items }) => getCellIndex(self, items),
    },
    item: {
      index: ({ index }) => index(),
      position: ({ parent, index }) => parent.cellIndex().position(index()),
    },
  },
};

function getCellIndex(table: TableState, cells: Signal<readonly TableCellState[]>): CellIndex {
  const indices: number[][] = Array.from(
    { length: table.rowcount() },
    () => new Array(table.colcount()),
  );
  let positions: TablePosition[] = new Array(cells().length);
  let r = 0;
  let c = 0;
  let filled = 0;
  for (let i = 0; i < cells().length; i++) {
    const cell = cells()[i];
    // Read the cell's index in order to trigger recomputation of the CellIndex if cells move.
    cell.index();
    // Find the next empty space.
    while (indices[r][c] !== undefined || c >= table.colcount()) {
      c++;
      if (c >= table.colcount()) {
        c = 0;
        r++;
      }
    }
    // Fill the current item into the empty space.
    positions[i] = { row: r, column: c };
    for (let cr = 0; cr < cell.rowspan(); cr++) {
      for (let cc = 0; cc < cell.colspan(); cc++) {
        if (r + cr >= table.rowcount() || c + cc >= table.colcount()) {
          throw Error('Cells do not fit');
        }
        if (indices[r + cr][c + cc] !== undefined) {
          throw new Error('Overlapping cells');
        }
        indices[r + cr][c + cc] = i;
        filled++;
      }
    }
    c += cell.colspan();
  }

  if (filled !== table.rowcount() * table.colcount()) {
    throw new Error('Not all cells filled');
  }
  return {
    position: (idx: number) => positions[idx],
    index: ({ row, column }: TablePosition) => indices[row][column],
  };
}

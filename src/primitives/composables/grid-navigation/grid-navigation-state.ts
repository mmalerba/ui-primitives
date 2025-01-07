import { Signal, WritableSignal } from '@angular/core';
import { ItemStateType, ParentStateType, StateSchema, writable } from '../../base/state';
import { CellIndex, TablePosition } from '../table/table-state';

export type GridNavigationInputs = {
  readonly activatedElement: Signal<HTMLElement | null>;
  readonly rowcount: Signal<number>;
  readonly colcount: Signal<number>;
  readonly cellIndex: Signal<CellIndex>;
};

export type GridNavigationItemInputs = {
  readonly element: HTMLElement;
  readonly rowspan: Signal<number>;
  readonly colspan: Signal<number>;
  readonly position: Signal<TablePosition>;
  readonly disabled: Signal<boolean>;
};

export type GridNavigationOutputs = {
  readonly activatedElement: WritableSignal<Element | null>;
  readonly activatedSubposition: WritableSignal<TablePosition>;
  readonly activeIndex: Signal<number>;
  readonly activePosition: Signal<TablePosition>;
};

export type GridNavigationItemOutputs = {
  readonly active: Signal<boolean>;
};

export type GridNavigationStateSchema = StateSchema<
  GridNavigationInputs,
  GridNavigationItemInputs,
  GridNavigationOutputs,
  GridNavigationItemOutputs
>;

export type GridNavigationState = ParentStateType<GridNavigationStateSchema>;

export type GridNavigationItemState = ItemStateType<GridNavigationStateSchema>;

const schema: GridNavigationStateSchema = {
  computations: {
    parent: {
      activatedElement: writable(({ inputValue }) => inputValue()),
      activatedSubposition: writable(() => ({ row: 0, column: 0 })),
      activeIndex: ({ self, items }) => {
        const idx = items().findIndex((item) => item.element === self.activatedElement());
        return idx === -1 && items().length ? getDefaultActiveIndex(self, items) : idx;
      },
      activePosition: ({ self, items }) => {
        if (self.activeIndex() === -1) {
          return { row: -1, column: -1 };
        }
        const position = items()[self.activeIndex()].position();
        const subposition = self.activatedSubposition();
        const rowspan = items()[self.activeIndex()].rowspan();
        const colspan = items()[self.activeIndex()].colspan();
        const row = position.row + Math.min(subposition.row, rowspan - 1);
        const col = position.column + Math.min(subposition.column, colspan - 1);
        return { row, column: col };
      },
    },
    item: {
      active: ({ parent, index }) => parent.activeIndex() === index(),
    },
  },
};

export function isInBounds({ row, column }: TablePosition, grid: GridNavigationState) {
  return row >= 0 && column >= 0 && row < grid.rowcount() && column < grid.colcount();
}

export function getNextColumn(
  grid: GridNavigationState,
  items: Signal<readonly GridNavigationItemState[]>,
  { row, column }: TablePosition,
  wrap: boolean,
): TablePosition {
  row = row === -1 ? 0 : row;
  const newPosition =
    column === grid.colcount() - 1 && wrap
      ? { row: row + 1, column: 0 }
      : { row, column: column + 1 };
  const cell = items()[grid.cellIndex().index(newPosition)];
  return cell ? { row, column: cell.position().column + cell.colspan() - 1 } : newPosition;
}

export function getPosition(
  grid: GridNavigationState,
  items: Signal<readonly GridNavigationItemState[]>,
  initial: TablePosition,
  navigateFn: (p: TablePosition) => TablePosition,
): TablePosition {
  const startPos = navigateFn(initial);
  let pos = startPos;
  while (true) {
    // Don't navigate if we go past the end of the list.
    if (!isInBounds(pos, grid)) {
      return { row: -1, column: -1 };
    }

    // If we land on a non-disabled item, stop and navigate to it.
    if (!items()[grid.cellIndex().index(pos)].disabled()) {
      break;
    }

    pos = navigateFn(pos);

    // Don't navigate if we loop back around to our starting position.
    if (pos === startPos) {
      return { row: -1, column: -1 };
    }
  }

  return pos;
}

function getDefaultActiveIndex(
  grid: GridNavigationState,
  items: Signal<readonly GridNavigationItemState[]>,
) {
  const firstFocusablePos = getPosition(grid, items, { row: -1, column: -1 }, (p) =>
    getNextColumn(grid, items, p, true),
  );
  if (!isInBounds(firstFocusablePos, grid)) {
    return -1;
  }
  return grid.cellIndex().index(firstFocusablePos);
}

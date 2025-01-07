import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import { TablePosition } from '../table/table-state';
import {
  getNextColumn,
  getPosition,
  GridNavigationItemState,
  GridNavigationState,
  isInBounds,
} from './grid-navigation-state';

export interface GridNavigationControllerOptions {
  wrap: boolean;
}

const defaultOptions: GridNavigationControllerOptions = {
  wrap: false,
};

export class ListNavigationController implements Controller {
  readonly handlers = {
    click: (e: MouseEvent) => this.clickManager.handle(e),
    keydown: (e: KeyboardEvent) => this.keydownManager().handle(e),
  } as const;

  readonly clickManager = new MouseEventManager().on(MouseButton.Main, (event) => {
    const index = this.items().findIndex((item) => item.element.contains(event.target as Node));
    const position = this.grid.cellIndex().position(index);
    this.navigateTo(position);
  });

  readonly keydownManager = computed(() => {
    return new KeyboardEventManager()
      .on('ArrowLeft', () => {
        this.navigatePreviousColumn();
      })
      .on('ArrowRight', () => {
        this.navigateNextColumn();
      })
      .on('ArrowUp', () => {
        this.navigatePreviousRow();
      })
      .on('ArrowDown', () => {
        this.navigateNextRow();
      });
  });

  private options: Signal<GridNavigationControllerOptions>;

  constructor(
    private readonly grid: GridNavigationState,
    private readonly items: Signal<readonly GridNavigationItemState[]>,
    options?: Signal<Partial<GridNavigationControllerOptions>>,
  ) {
    this.options = computed(() => ({ ...defaultOptions, ...options?.() }));
  }

  navigateTo(position: TablePosition): void {
    this.navigate(position, () => position);
  }

  navigatePreviousColumn() {
    this.navigate(this.grid.activePosition(), this.getPreviousColumn);
  }

  navigateNextColumn() {
    this.navigate(this.grid.activePosition(), this.getNextColumn);
  }

  navigateNextRow() {
    this.navigate(this.grid.activePosition(), this.getNextColumn);
  }

  navigatePreviousRow() {
    this.navigate(this.grid.activePosition(), this.getPreviousColumn);
  }

  navigateFirstRow() {
    this.navigate({ row: -1, column: this.grid.activePosition().column }, this.getNextRow);
  }

  navigateLastRow() {
    this.navigate(
      { row: this.grid.rowcount(), column: this.grid.activePosition().column },
      this.getPreviousRow,
    );
  }

  navigateFirstColumn() {
    this.navigate({ row: this.grid.activePosition().row, column: -1 }, this.getNextColumn);
  }

  navigateLastColumn() {
    this.navigate(
      { row: this.grid.activePosition().row, column: this.grid.colcount() },
      this.getPreviousRow,
    );
  }

  navigateFirst() {
    this.navigate({ row: -1, column: -1 }, this.getNextColumn);
  }

  navigateLast() {
    this.navigate(
      { row: this.grid.rowcount(), column: this.grid.colcount() },
      this.getPreviousColumn,
    );
  }

  private getNextColumn = (position: TablePosition) => {
    return getNextColumn(this.grid, this.items, position, this.options().wrap);
  };

  private getPreviousColumn = ({ row, column }: TablePosition) => {
    row = row === this.grid.rowcount() ? row - 1 : row;
    const newPosition =
      column === 0 && this.options().wrap
        ? { row: row - 1, column: this.grid.colcount() - 1 }
        : { row, column: column - 1 };
    const cell = this.items()[this.grid.cellIndex().index(newPosition)];
    return cell ? { row, column: cell.position().column } : newPosition;
  };

  private getNextRow = ({ row, column }: TablePosition) => {
    column = column === -1 ? 0 : column;
    const newPosition =
      row === this.grid.rowcount() - 1 && this.options().wrap
        ? { row: 0, column: column + 1 }
        : { row: row + 1, column };
    const cell = this.items()[this.grid.cellIndex().index(newPosition)];
    return cell ? { row: cell.position().row + cell.rowspan() - 1, column } : newPosition;
  };

  private getPreviousRow = ({ row, column }: TablePosition) => {
    column = column === this.grid.colcount() ? column - 1 : column;
    const newPosition =
      row === 0 && this.options().wrap
        ? { row: this.grid.rowcount() - 1, column: column - 1 }
        : { row: row - 1, column };
    const cell = this.items()[this.grid.cellIndex().index(newPosition)];
    return cell ? { row: cell.position().row, column } : newPosition;
  };

  private navigate(initial: TablePosition, navigateFn: (i: TablePosition) => TablePosition): void {
    const position = getPosition(this.grid, this.items, initial, navigateFn);
    if (isInBounds(position, this.grid)) {
      const index = this.grid.cellIndex().index(position);
      const cellPosition = this.items()[index].position();
      this.grid.activatedElement.set(this.items()[index].element);
      this.grid.activatedSubposition.set({
        row: position.row - cellPosition.row,
        column: position.column - cellPosition.column,
      });
    }
  }
}

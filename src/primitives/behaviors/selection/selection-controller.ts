// TODO: don't select disabled items.

import { computed, Signal } from '@angular/core';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { SelectionItemState, SelectionState } from './selection-behavior';

export class SelectionController<T> {
  constructor(
    private readonly parent: SelectionState<T>,
    private readonly items: Signal<readonly SelectionItemState<T>[]>,
  ) {}

  keydownManager = computed(() =>
    new KeyboardEventManager().on(' ', () => {
      this.select();
    }),
  );

  select() {
    const index = this.parent.activeIndex();
    if (this.parent.selectionType() === 'multiple') {
      this.setSelection([...this.parent.selectedIndices(), index]);
    } else {
      this.setSelection([index]);
    }
    this.parent.lastSelectedIndex.set(index);
  }

  deselect() {
    const index = this.parent.activeIndex();
    this.setSelection(this.parent.selectedIndices().filter((i) => i !== index));
    this.parent.lastSelectedIndex.set(index);
  }

  toggle() {
    this.parent.selectedIndices().includes(this.parent.activeIndex())
      ? this.deselect()
      : this.select();
  }

  selectAll() {
    this.setSelection(this.items().map((_, i) => i));
    this.parent.lastSelectedIndex.set(-1);
  }

  deselectAll() {
    this.setSelection([]);
    this.parent.lastSelectedIndex.set(-1);
  }

  toggleAll() {
    if (this.parent.selectedIndices().length === this.items().length) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  }

  selectContiguousRange() {
    this.selectRange(this.parent.lastSelectedIndex(), this.parent.activeIndex());
  }

  selectRange(fromIndex: number, toIndex: number) {
    const upper = Math.min(Math.max(fromIndex, toIndex), this.items().length - 1);
    const lower = Math.max(Math.min(fromIndex, toIndex), 0);
    const range = Array.from({ length: upper - lower + 1 }, (_, i) => lower + i);
    this.setSelection([...this.parent.selectedIndices(), ...range]);
    this.parent.lastSelectedIndex.set(toIndex);
  }

  private setSelection(selection: number[]) {
    const newSelection = selection.map((i) => this.items()[i].value());
    const currentSelection = this.parent.selectedValues();
    if (!this.isSelectionEqual(newSelection, currentSelection)) {
      this.parent.selectedValues.set(newSelection);
    }
  }

  private isSelectionEqual(s1: readonly T[], s2: readonly T[]): boolean {
    if (s1.length !== s2.length) {
      return false;
    }
    for (let i = 0; i < s1.length; i++) {
      if (!this.parent.compareValues()(s1[i], s2[i])) {
        return false;
      }
    }
    return true;
  }
}

import { Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { SelectionOptionState, SelectionState } from './selection-state';

export class SelectionController implements Controller {
  // Note: The mouse and keyboard bindings for selection are tightly coupled to how navigation works
  // in the composed component. Therefore we don't implement them here and leave their
  // implementation to the composing class.
  readonly handlers = {} as const;

  constructor(
    private readonly parent: SelectionState<any>,
    private readonly options: Signal<readonly SelectionOptionState<any>[]>,
  ) {}

  select(index: number) {
    if (this.parent.selectionType() === 'single') {
      this.setSingleSelection(index);
    } else {
      this.selectRange(index, index);
    }
  }

  deselect(index: number) {
    this.deselectRange(index, index);
  }

  toggle(index: number) {
    this.options()[index]?.selected() ? this.deselect(index) : this.select(index);
  }

  selectAll() {
    this.selectRange(0, this.options().length - 1);
    this.parent.lastSelectedIndex.set(-1);
  }

  deselectAll() {
    this.deselectRange(0, this.options().length - 1);
  }

  toggleAll() {
    if (this.parent.selectedIndices().length === this.options().length) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  }

  selectContiguousRange(toIndex: number) {
    if (this.parent.lastSelectedIndex() < 0) {
      return;
    }
    this.selectRange(this.parent.lastSelectedIndex(), toIndex);
  }

  selectRange(fromIndex: number, toIndex: number) {
    if (!this.isIndexSelectable(toIndex)) {
      return;
    }
    const lower = Math.min(fromIndex, toIndex);
    const upper = Math.max(fromIndex, toIndex);
    let newValues = new Set(this.parent.selectedValues());
    for (let idx = Math.max(lower, 0); idx <= Math.min(upper, this.options().length - 1); idx++) {
      if (this.options()[idx].compositeDisabled() || this.options()[idx].selected()) {
        continue;
      }
      newValues.add(this.options()[idx].value());
      this.parent.lastSelectedIndex.set(idx);
    }
    if (newValues.size !== this.parent.selectedValues().size) {
      this.parent.selectedValues.set(newValues);
    }
  }

  deselectRange(fromIndex: number, toIndex: number) {
    if (!this.isIndexSelectable(toIndex)) {
      return;
    }
    const lower = Math.min(fromIndex, toIndex);
    const upper = Math.max(fromIndex, toIndex);
    let newValues: Set<unknown> = new Set(this.parent.selectedValues());
    for (let idx = Math.max(lower, 0); idx <= Math.min(upper, this.options().length - 1); idx++) {
      if (this.options()[idx].compositeDisabled() || !this.options()[idx].selected()) {
        continue;
      }
      newValues.delete(this.options()[idx].value());
    }
    if (newValues.size !== this.parent.selectedValues().size) {
      this.parent.selectedValues.set(newValues);
    }
  }

  setSingleSelection(index: number) {
    if (!this.isIndexSelectable(index) || this.options()[index].selected()) {
      return;
    }
    this.parent.selectedValues.set(new Set([this.options()[index].value()]));
    this.parent.lastSelectedIndex.set(index);
  }

  private isIndexSelectable(index: number) {
    return this.options()[index] && !this.options()[index].compositeDisabled();
  }
}

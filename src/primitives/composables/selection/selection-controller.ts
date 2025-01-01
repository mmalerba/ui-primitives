import { Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import { SelectionOptionState, SelectionState } from './selection-state';

export class SelectionController implements Controller {
  readonly handlers = {
    click: (e: MouseEvent) => this.getClickManager().handle(e),
    keydown: (e: KeyboardEvent) => this.getKeydownManager().handle(e),
  } as const;

  constructor(
    private readonly parent: SelectionState<any>,
    private readonly options: Signal<readonly SelectionOptionState<any>[]>,
  ) {}

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
    this.setSelection(this.options().map((_, i) => i));
    this.parent.lastSelectedIndex.set(-1);
  }

  deselectAll() {
    this.setSelection([]);
    this.parent.lastSelectedIndex.set(-1);
  }

  toggleAll() {
    if (this.parent.selectedIndices().length === this.options().length) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  }

  selectContiguousRange() {
    this.selectRange(this.parent.lastSelectedIndex(), this.parent.activeIndex());
  }

  selectRange(fromIndex: number, toIndex: number) {
    const upper = Math.min(Math.max(fromIndex, toIndex), this.options().length - 1);
    const lower = Math.max(Math.min(fromIndex, toIndex), 0);
    const range = Array.from({ length: upper - lower + 1 }, (_, i) => lower + i);
    this.setSelection([...this.parent.selectedIndices(), ...range]);
    this.parent.lastSelectedIndex.set(toIndex);
  }

  private setSelection(selection: number[]) {
    const newSelection = selection.map((i) => this.options()[i].value());
    const currentSelection = this.parent.selectedValues();
    if (!this.isSelectionEqual(newSelection, currentSelection)) {
      this.parent.selectedValues.set(newSelection);
    }
  }

  private isSelectionEqual(s1: readonly unknown[], s2: readonly unknown[]): boolean {
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

  private getClickManager() {
    return this.parent.selectionType() === 'multiple'
      ? new MouseEventManager().on(MouseButton.Main, () => {
          this.select();
        })
      : new MouseEventManager()
          .on(MouseButton.Main, () => {
            this.toggle();
          })
          .on(ModifierKey.Shift, MouseButton.Main, () => {
            this.selectContiguousRange();
          });
  }

  private getKeydownManager() {
    // When using the followfocus strategy, the behavior is highly dependent on how navigation
    // works in the fully composed component. The implementation should be left up to the
    // composing class, it doesn't really make sense to provide a default implementation.
    return this.parent.selectionStrategy() === 'followfocus'
      ? new KeyboardEventManager()
      : new KeyboardEventManager().on(' ', () => {
          this.select();
        });
  }
}

import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import { SelectionOptionState, SelectionState } from './selection-state';

export class SelectionController implements Controller {
  readonly handlers = {
    keydown: (e: KeyboardEvent) => this.keydownManager().handle(e),
    click: (e: MouseEvent) => this.clickManager().handle(e),
  } as const;

  readonly clickManager = () => {
    if (this.parent.selectionType() === 'single') {
      return new MouseEventManager().on(MouseButton.Main, (event) => {
        this.select(this.getTargetIndex(event));
      });
    }
    return new MouseEventManager()
      .on(MouseButton.Main, (event) => {
        this.toggle(this.getTargetIndex(event));
      })
      .on(ModifierKey.Shift, MouseButton.Main, (event) => {
        this.selectContiguousRange(this.getTargetIndex(event));
      });
  };

  readonly keydownManager = computed(() => {
    if (this.parent.selectionStrategy() === 'explicit') {
      if (this.parent.selectionType() === 'single') {
        return new KeyboardEventManager().on(' ', () => {
          this.select(this.parent.activeIndex());
        });
      } else {
        return new KeyboardEventManager()
          .on(' ', () => {
            this.toggle(this.parent.activeIndex());
          })
          .on(ModifierKey.Shift, ' ', () => {
            this.selectContiguousRange(this.parent.activeIndex());
          })
          .on(ModifierKey.Ctrl, 'a', () => {
            this.toggleAll();
          });
      }
    } else {
      if (this.parent.selectionType() === 'single') {
        return new KeyboardEventManager();
      } else {
        return new KeyboardEventManager()
          .on(ModifierKey.Ctrl, ' ', () => {
            this.toggle(this.parent.activeIndex());
          })
          .on(ModifierKey.Shift, ' ', () => {
            this.selectContiguousRange(this.parent.activeIndex());
          })
          .on(ModifierKey.Ctrl, 'a', () => {
            this.toggleAll();
          });
      }
    }
  });

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

  private getTargetIndex(event: MouseEvent) {
    return this.options().findIndex((option) => option.element.contains(event.target as Node));
  }
}

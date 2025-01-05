import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { GenericEventManager, getModifiers, ModifierKey } from '../../base/event-manager';
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

  private previousActiveIndex = -1;

  constructor(
    private readonly parent: SelectionState<any>,
    private readonly items: Signal<readonly SelectionOptionState<any>[]>,
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
    this.items()[index]?.selected() ? this.deselect(index) : this.select(index);
  }

  selectAll() {
    this.selectRange(0, this.items().length - 1);
    this.parent.lastSelectedIndex.set(-1);
  }

  deselectAll() {
    this.deselectRange(0, this.items().length - 1);
  }

  toggleAll() {
    if (this.parent.selectedIndices().length === this.items().length) {
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
    for (let idx = Math.max(lower, 0); idx <= Math.min(upper, this.items().length - 1); idx++) {
      if (this.items()[idx].disabled() || this.items()[idx].selected()) {
        continue;
      }
      newValues.add(this.items()[idx].value());
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
    for (let idx = Math.max(lower, 0); idx <= Math.min(upper, this.items().length - 1); idx++) {
      if (this.items()[idx].disabled() || !this.items()[idx].selected()) {
        continue;
      }
      newValues.delete(this.items()[idx].value());
    }
    if (newValues.size !== this.parent.selectedValues().size) {
      this.parent.selectedValues.set(newValues);
    }
  }

  setSingleSelection(index: number) {
    if (!this.isIndexSelectable(index) || this.items()[index].selected()) {
      return;
    }
    this.parent.selectedValues.set(new Set([this.items()[index].value()]));
    this.parent.lastSelectedIndex.set(index);
  }

  addSelectionOnNavigation(navigationKeydownManager: GenericEventManager<KeyboardEvent>) {
    return navigationKeydownManager
      .beforeHandling(() => {
        this.previousActiveIndex = this.parent.activeIndex();
      })
      .afterHandling((event) => {
        const modifiers = getModifiers(event);
        if (modifiers === ModifierKey.None && this.parent.selectionStrategy() === 'followfocus') {
          if (this.parent.selectionType() === 'single') {
            this.select(this.parent.activeIndex());
          } else {
            this.deselectAll();
            this.select(this.parent.activeIndex());
          }
        }
        if (modifiers === ModifierKey.Shift && this.parent.selectionType() === 'multiple') {
          this.toggle(this.parent.activeIndex());
        }
        if (modifiers === (ModifierKey.Ctrl | ModifierKey.Shift)) {
          this.selectRange(this.previousActiveIndex, this.parent.activeIndex());
        }
      });
  }

  private isIndexSelectable(index: number) {
    return this.items()[index] && !this.items()[index].disabled();
  }

  private getTargetIndex(event: MouseEvent) {
    return this.items().findIndex((option) => option.element.contains(event.target as Node));
  }
}

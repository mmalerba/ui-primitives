import { Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { MouseButton, MouseEventManager } from '../../base/mouse-event-manager';
import { CompositeFocusController } from '../composite-focus/composite-focus-controller';
import { ListNavigationController } from '../list-navigation/list-navigation-controller';
import { SelectionController } from '../selection/selection-controller';
import { ListboxOptionState, ListboxState } from './listbox-state';

export class ListboxController implements Controller {
  private focusController: CompositeFocusController;
  private navigationController: ListNavigationController;
  private selectionController: SelectionController;

  readonly handlers = {
    click: (e: MouseEvent) => {
      const handler =
        this.listbox.selectionType() === 'multiple'
          ? this.multiSelectionClickManager
          : this.singleSelectionClickManager;
      return handler.handle(e);
    },
    keydown: (e: KeyboardEvent) => this.getKeydownManager().handle(e),
    focusout: (e: FocusEvent) => this.focusController.handlers.focusout(e),
  } as const;

  private singleSelectionClickManager = new MouseEventManager().on(MouseButton.Main, (event) => {
    const index = this.options().findIndex(
      (o) => o.element.contains(event.target as Node) && !o.disabled(),
    );
    this.navigationController.navigateTo(index);
    this.selectionController.select();
  });

  private multiSelectionClickManager = new MouseEventManager()
    .on(MouseButton.Main, (event) => {
      const index = this.options().findIndex(
        (o) => o.element.contains(event.target as Node) && !o.disabled(),
      );
      this.navigationController.navigateTo(index);
      this.selectionController.toggle();
    })
    .on(ModifierKey.Shift, MouseButton.Main, (event) => {
      const index = this.options().findIndex(
        (o) => o.element.contains(event.target as Node) && !o.disabled(),
      );
      this.navigationController.navigateTo(index);
      this.selectionController.selectContiguousRange();
    });

  constructor(
    private readonly listbox: ListboxState<any>,
    private readonly options: Signal<readonly ListboxOptionState<any>[]>,
  ) {
    this.focusController = new CompositeFocusController(listbox, options);
    this.navigationController = new ListNavigationController(listbox, options);
    this.selectionController = new SelectionController(listbox, options);
  }

  private getKeydownManager() {
    const previousKey = this.listbox.orientation() === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = this.listbox.orientation() === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    if (this.listbox.selectionType() === 'multiple') {
      if (this.listbox.selectionStrategy() === 'followfocus') {
        return this.getFollowFocusMultiSelectionKeydownManager(previousKey, nextKey);
      }
      return this.getExplicitMultiSelectionKeydownManager(previousKey, nextKey);
    } else {
      if (this.listbox.selectionStrategy() === 'explicit') {
        return this.getExplicitSingleSelectionKeydownManager(previousKey, nextKey);
      }
      return this.getFollowFocusSingleSelectionKeydownManager(previousKey, nextKey);
    }
  }

  private getFollowFocusSingleSelectionKeydownManager(previousKey: string, nextKey: string) {
    return new KeyboardEventManager()
      .on(previousKey, () => {
        this.navigationController.navigatePrevious();
        this.selectionController.select();
      })
      .on(nextKey, () => {
        this.navigationController.navigateNext();
        this.selectionController.select();
      })
      .on('Home', () => {
        this.navigationController.navigateFirst();
        this.selectionController.select();
      })
      .on('End', () => {
        this.navigationController.navigateLast();
        this.selectionController.select();
      }); /*
      .on(
        [ModifierKey.None, ModifierKey.Shift],
        (key) => this.typeaheadController.isValidCharacter(key),
        (event) => {
          this.typeaheadController.search(event.key);
          this.selectionController.select();
        },
      );*/
  }

  private getExplicitSingleSelectionKeydownManager(previousKey: string, nextKey: string) {
    return new KeyboardEventManager()
      .on(previousKey, () => {
        this.navigationController.navigatePrevious();
      })
      .on(nextKey, () => {
        this.navigationController.navigateNext();
      })
      .on('Home', () => {
        this.navigationController.navigateFirst();
      })
      .on('End', () => {
        this.navigationController.navigateLast();
      })
      .on(' ', () => {
        this.selectionController.select();
      }); /*
      .on(
        [ModifierKey.None, ModifierKey.Shift],
        (key) => this.typeaheadController.isValidCharacter(key),
        (event) => {
          this.typeaheadController.search(event.key);
        },
      );*/
  }

  private getExplicitMultiSelectionKeydownManager(previousKey: string, nextKey: string) {
    return new KeyboardEventManager()
      .on(previousKey, () => {
        this.navigationController.navigatePrevious();
      })
      .on(nextKey, () => {
        this.navigationController.navigateNext();
      })
      .on('Home', () => {
        this.navigationController.navigateFirst();
      })
      .on('End', () => {
        this.navigationController.navigateLast();
      })
      .on(' ', () => {
        this.selectionController.toggle();
      })
      .on(ModifierKey.Shift, previousKey, () => {
        this.navigationController.navigatePrevious();
        this.selectionController.toggle();
      })
      .on(ModifierKey.Shift, nextKey, () => {
        this.navigationController.navigateNext();
        this.selectionController.toggle();
      })
      .on(ModifierKey.Shift, ' ', () => {
        this.selectionController.selectContiguousRange();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), 0);
        this.navigationController.navigateFirst();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), this.options().length - 1);
        this.navigationController.navigateLast();
      })
      .on(ModifierKey.Ctrl, 'a', () => {
        this.selectionController.toggleAll();
      }); /*
      .on(
        [ModifierKey.None, ModifierKey.Shift],
        (key) => this.typeaheadController.isValidCharacter(key),
        (event) => {
          this.typeaheadController.search(event.key);
        },
      );*/
  }

  private getFollowFocusMultiSelectionKeydownManager(previousKey: string, nextKey: string) {
    return new KeyboardEventManager()
      .on(previousKey, () => {
        this.navigationController.navigatePrevious();
        this.selectionController.deselectAll();
        this.selectionController.select();
      })
      .on(nextKey, () => {
        this.navigationController.navigateNext();
        this.selectionController.deselectAll();
        this.selectionController.select();
      })
      .on('Home', () => {
        this.navigationController.navigateFirst();
        this.selectionController.deselectAll();
        this.selectionController.select();
      })
      .on('End', () => {
        this.navigationController.navigateLast();
        this.selectionController.deselectAll();
        this.selectionController.select();
      })
      .on(ModifierKey.Shift, previousKey, () => {
        this.navigationController.navigatePrevious();
        this.selectionController.toggle();
      })
      .on(ModifierKey.Shift, nextKey, () => {
        this.navigationController.navigateNext();
        this.selectionController.toggle();
      })
      .on(ModifierKey.Ctrl, previousKey, () => {
        this.navigationController.navigatePrevious();
      })
      .on(ModifierKey.Ctrl, nextKey, () => {
        this.navigationController.navigateNext();
      })
      .on(ModifierKey.Ctrl, ' ', () => {
        this.selectionController.toggle();
      })
      .on(ModifierKey.Shift, ' ', () => {
        this.selectionController.selectContiguousRange();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), 0);
        this.navigationController.navigateFirst();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), this.options().length - 1);
        this.navigationController.navigateLast();
      })
      .on(ModifierKey.Ctrl, 'a', () => {
        this.selectionController.toggleAll();
      }); /*
      .on(
        [ModifierKey.None, ModifierKey.Shift],
        (key) => this.typeaheadController.isValidCharacter(key),
        (event) => {
          this.typeaheadController.search(event.key);
          this.selectionController.deselectAll();
          this.selectionController.select();
        },
      );*/
  }
}

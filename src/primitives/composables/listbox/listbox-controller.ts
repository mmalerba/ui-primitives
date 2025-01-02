import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { EventManager, GenericEventManager, ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { CompositeFocusController } from '../composite-focus/composite-focus-controller';
import { ListNavigationController } from '../list-navigation/list-navigation-controller';
import { SelectionController } from '../selection/selection-controller';
import { ListboxOptionState, ListboxState } from './listbox-state';

export class ListboxController implements Controller {
  private focusController: CompositeFocusController;
  private navigationController: ListNavigationController;
  private selectionController: SelectionController;

  readonly handlers = {
    click: (e: MouseEvent) => this.clickManager().handle(e),
    keydown: (e: KeyboardEvent) => this.keydownManager().handle(e),
    focusout: (e: FocusEvent) => this.focusoutManager.handle(e),
  } as const;

  readonly clickManager = computed(() =>
    EventManager.compose(
      this.navigationController.clickManager,
      this.selectionController.clickManager(),
    ),
  );

  readonly keydownManager = computed(() => {
    if (this.listbox.selectionStrategy() === 'explicit') {
      if (this.listbox.selectionType() === 'single') {
        return this.getExplicitSingleSelectionKeydownManager();
      } else {
        return this.getExplicitMultiSelectionKeydownManager();
      }
    } else {
      if (this.listbox.selectionType() === 'single') {
        return this.getFollowFocusSingleSelectionKeydownManager();
      } else {
        return this.getFollowFocusMultiSelectionKeydownManager();
      }
    }
  });

  readonly focusoutManager: GenericEventManager<FocusEvent>;

  constructor(
    private readonly listbox: ListboxState<any>,
    private readonly options: Signal<readonly ListboxOptionState<any>[]>,
  ) {
    this.focusController = new CompositeFocusController(listbox, options);
    this.navigationController = new ListNavigationController(listbox, options);
    this.selectionController = new SelectionController(listbox, options);
    this.focusoutManager = this.focusController.focusutManager;
  }

  private getFollowFocusSingleSelectionKeydownManager() {
    const navigationController = new ListNavigationController(this.listbox, this.options, {
      afterNavigation: () => {
        this.selectionController.select(this.listbox.activeIndex());
      },
    });
    return EventManager.compose(
      navigationController.keydownManager(),
      this.selectionController.keydownManager(),
    );
  }

  private getExplicitSingleSelectionKeydownManager() {
    return EventManager.compose(
      this.navigationController.keydownManager(),
      this.selectionController.keydownManager(),
    );
  }

  private getExplicitMultiSelectionKeydownManager() {
    const shiftNavigationController = new ListNavigationController(this.listbox, this.options, {
      keydownModifier: ModifierKey.Shift,
      afterNavigation: () => {
        this.selectionController.toggle(this.listbox.activeIndex());
      },
    });
    return EventManager.compose(
      this.navigationController.keydownManager(),
      this.selectionController.keydownManager(),
      shiftNavigationController.keydownManager().override(
        (key) => ['Home', 'End'].includes(key),
        () => false,
      ),
      // Custom logic for ctrl+shift home/end
      new KeyboardEventManager()
        .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
          this.selectionController.selectRange(this.listbox.activeIndex(), 0);
          this.navigationController.navigateFirst();
        })
        .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
          this.selectionController.selectRange(
            this.listbox.activeIndex(),
            this.options().length - 1,
          );
          this.navigationController.navigateLast();
        }),
    );
  }

  private getFollowFocusMultiSelectionKeydownManager() {
    const navigationController = new ListNavigationController(this.listbox, this.options, {
      afterNavigation: () => {
        this.selectionController.deselectAll();
        this.selectionController.select(this.listbox.activeIndex());
      },
    });
    const shiftNavigationController = new ListNavigationController(this.listbox, this.options, {
      keydownModifier: ModifierKey.Shift,
      afterNavigation: () => {
        this.selectionController.toggle(this.listbox.activeIndex());
      },
    });
    const ctrlNavigationController = new ListNavigationController(this.listbox, this.options, {
      keydownModifier: ModifierKey.Ctrl,
    });
    return EventManager.compose(
      navigationController.keydownManager(),
      this.selectionController.keydownManager(),
      shiftNavigationController.keydownManager().override(
        (key) => ['Home', 'End'].includes(key),
        () => false,
      ),
      ctrlNavigationController.keydownManager().override(
        (key) => ['Home', 'End'].includes(key),
        () => false,
      ),
      // Custom logic for ctrl+shift home/end
      new KeyboardEventManager()
        .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
          this.selectionController.selectRange(this.listbox.activeIndex(), 0);
          this.navigationController.navigateFirst();
        })
        .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
          this.selectionController.selectRange(
            this.listbox.activeIndex(),
            this.options().length - 1,
          );
          this.navigationController.navigateLast();
        }),
    );
  }
}

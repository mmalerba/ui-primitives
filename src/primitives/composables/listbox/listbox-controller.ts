import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { EventManager, GenericEventManager, ModifierKey } from '../../base/event-manager';
import { CompositeFocusController } from '../composite-focus/composite-focus-controller';
import { ListNavigationController } from '../list-navigation/list-navigation-controller';
import { SelectionController } from '../selection/selection-controller';
import { TypeaheadController } from '../typeahead/typeahead-controller';
import { ListboxOptionState, ListboxState } from './listbox-state';

export class ListboxControllerOptions {
  wrapNavigation = false;
}

const defaultOptions: ListboxControllerOptions = {
  wrapNavigation: false,
};

export class ListboxController implements Controller {
  private focusController: CompositeFocusController;
  private navigationController: ListNavigationController;
  private selectionController: SelectionController;
  private typeaheadController: TypeaheadController;

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
    return EventManager.compose(
      this.navigationKeydownManager(),
      this.selectionController.keydownManager(),
    );
  });

  readonly focusoutManager: GenericEventManager<FocusEvent>;

  private readonly navigationKeydownManager = computed(() => {
    return this.selectionController.addSelectionOnNavigation(
      EventManager.compose(
        this.navigationController.keydownManager(),
        this.typeaheadController.keydownManager,
      ),
    );
  });

  private readonly navigationOptions = computed(() => ({
    arrowKeyModifiers:
      this.parent.selectionType() === 'single'
        ? [ModifierKey.None]
        : this.parent.selectionStrategy() === 'explicit'
          ? [ModifierKey.None, ModifierKey.Shift]
          : [ModifierKey.None, ModifierKey.Shift, ModifierKey.Ctrl],
    homeEndKeyModifiers:
      this.parent.selectionType() === 'single'
        ? [ModifierKey.None]
        : [ModifierKey.None, ModifierKey.Ctrl | ModifierKey.Shift],
    wrap: this.options().wrapNavigation,
  }));

  private options: Signal<ListboxControllerOptions>;

  constructor(
    private readonly parent: ListboxState<any>,
    items: Signal<readonly ListboxOptionState<any>[]>,
    options?: Signal<Partial<ListboxControllerOptions>>,
  ) {
    this.options = computed(() => ({ ...defaultOptions, ...options?.() }));
    this.focusController = new CompositeFocusController(parent, items);
    this.selectionController = new SelectionController(parent, items);
    this.typeaheadController = new TypeaheadController(parent, items);
    this.navigationController = new ListNavigationController(parent, items, this.navigationOptions);
    this.focusoutManager = this.focusController.focusoutManager;
  }
}

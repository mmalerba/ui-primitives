import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { EventManager, GenericEventManager, ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
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

  private afterNavigation = computed(() => {
    if (this.parent.selectionStrategy() !== 'followfocus') {
      return undefined;
    }
    if (this.parent.selectionType() === 'single') {
      return () => {
        this.selectionController.select(this.parent.activeIndex());
      };
    } else {
      return () => {
        this.selectionController.deselectAll();
        this.selectionController.select(this.parent.activeIndex());
      };
    }
  });

  private shiftNavigationKeydownManager = computed(() => {
    if (this.parent.selectionType() !== 'multiple') {
      return undefined;
    }
    return new ListNavigationController(
      this.parent,
      this.items,
      computed(() => ({
        keydownModifier: ModifierKey.Shift,
        afterNavigation: () => {
          this.selectionController.toggle(this.parent.activeIndex());
        },
        wrap: this.options().wrapNavigation,
      })),
    )
      .keydownManager()
      .override(
        (key) => ['Home', 'End'].includes(key),
        () => false,
      );
  });

  private ctrlNavigationKeydownManager = computed(() => {
    if (
      this.parent.selectionType() === 'multiple' &&
      this.parent.selectionStrategy() === 'explicit'
    ) {
      return new ListNavigationController(
        this.parent,
        this.items,
        computed(() => ({
          keydownModifier: ModifierKey.Ctrl,
          wrap: this.options().wrapNavigation,
        })),
      )
        .keydownManager()
        .override(
          (key) => ['Home', 'End'].includes(key),
          () => false,
        );
    }
    return undefined;
  });

  private ctrlShiftNavigationKeydownManager = computed(() => {
    if (this.parent.selectionType() !== 'multiple') {
      return undefined;
    }
    return new KeyboardEventManager()
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
        this.selectionController.selectRange(this.parent.activeIndex(), 0);
        this.navigationController.navigateFirst();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
        this.selectionController.selectRange(this.parent.activeIndex(), this.items().length - 1);
        this.navigationController.navigateLast();
      });
  });

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
    const managers: EventManager<KeyboardEvent>[] = [
      this.navigationController.keydownManager(),
      this.typeaheadController.keydownManager,
      this.selectionController.keydownManager(),
    ];
    if (this.shiftNavigationKeydownManager()) {
      managers.push(this.shiftNavigationKeydownManager()!);
    }
    if (this.ctrlNavigationKeydownManager()) {
      managers.push(this.ctrlNavigationKeydownManager()!);
    }
    if (this.ctrlShiftNavigationKeydownManager()) {
      managers.push(this.ctrlShiftNavigationKeydownManager()!);
    }
    return EventManager.compose(...managers);
  });

  readonly focusoutManager: GenericEventManager<FocusEvent>;

  private options: Signal<ListboxControllerOptions>;

  constructor(
    private readonly parent: ListboxState<any>,
    private readonly items: Signal<readonly ListboxOptionState<any>[]>,
    options?: Signal<Partial<ListboxControllerOptions>>,
  ) {
    this.options = computed(() => ({ ...defaultOptions, ...options?.() }));
    this.focusController = new CompositeFocusController(parent, items);
    this.selectionController = new SelectionController(parent, items);
    this.typeaheadController = new TypeaheadController(
      parent,
      items,
      computed(() => ({
        afterNavigation: this.afterNavigation(),
      })),
    );
    this.navigationController = new ListNavigationController(
      parent,
      items,
      computed(() => ({
        afterNavigation: this.afterNavigation(),
        wrap: this.options().wrapNavigation,
      })),
    );
    this.focusoutManager = this.focusController.focusutManager;
  }
}

import { computed, Signal } from '@angular/core';
import { Controller } from '../../base/controller';
import { EventManager, GenericEventManager, ModifierKey } from '../../base/event-manager';
import { KeyboardEventManager } from '../../base/keyboard-event-manager';
import { CompositeFocusController } from '../composite-focus/composite-focus-controller';
import { ListNavigationController } from '../list-navigation/list-navigation-controller';
import { SelectionController } from '../selection/selection-controller';
import { TypeaheadController } from '../typeahead/typeahead-controller';
import { ListboxOptionState, ListboxState } from './listbox-state';

export class ListboxController implements Controller {
  private focusController: CompositeFocusController;
  private navigationController: ListNavigationController;
  private selectionController: SelectionController;
  private typeaheadController: TypeaheadController;

  private afterNavigation = computed(() => {
    if (this.listbox.selectionStrategy() !== 'followfocus') {
      return undefined;
    }
    if (this.listbox.selectionType() === 'single') {
      return () => {
        this.selectionController.select(this.listbox.activeIndex());
      };
    } else {
      return () => {
        this.selectionController.deselectAll();
        this.selectionController.select(this.listbox.activeIndex());
      };
    }
  });

  private shiftNavigationKeydownManager = computed(() => {
    if (this.listbox.selectionType() !== 'multiple') {
      return undefined;
    }
    return new ListNavigationController(
      this.listbox,
      this.options,
      computed(() => ({
        keydownModifier: ModifierKey.Shift,
        afterNavigation: () => {
          this.selectionController.toggle(this.listbox.activeIndex());
        },
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
      this.listbox.selectionType() === 'multiple' &&
      this.listbox.selectionStrategy() === 'explicit'
    ) {
      return new ListNavigationController(
        this.listbox,
        this.options,
        computed(() => ({ keydownModifier: ModifierKey.Ctrl })),
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
    if (this.listbox.selectionType() !== 'multiple') {
      return undefined;
    }
    return new KeyboardEventManager()
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'Home', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), 0);
        this.navigationController.navigateFirst();
      })
      .on(ModifierKey.Ctrl | ModifierKey.Shift, 'End', () => {
        this.selectionController.selectRange(this.listbox.activeIndex(), this.options().length - 1);
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

  constructor(
    private readonly listbox: ListboxState<any>,
    private readonly options: Signal<readonly ListboxOptionState<any>[]>,
  ) {
    this.focusController = new CompositeFocusController(listbox, options);
    this.selectionController = new SelectionController(listbox, options);
    this.typeaheadController = new TypeaheadController(
      listbox,
      options,
      computed(() => ({
        afterNavigation: this.afterNavigation(),
      })),
    );
    this.navigationController = new ListNavigationController(
      listbox,
      options,
      computed(() => ({
        afterNavigation: this.afterNavigation(),
      })),
    );
    this.focusoutManager = this.focusController.focusutManager;
  }
}

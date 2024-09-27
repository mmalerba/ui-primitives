import { signal, WritableSignal } from '@angular/core';
import {
  ActiveDescendantItemState,
  ActiveDescendantState,
  getActiveDescendantStateMachine,
} from '../behaviors/active-descendant';
import { EventDispatcher } from './event-dispatcher';
import {
  applyDynamicStateMachine,
  applyStateMachine,
  compose,
  StateMachine,
} from './state-machine';

function getInitialState() {
  const items: ActiveDescendantItemState[] = [
    {
      identity: {},
      id: signal('id1'),
      tabindex: signal<0 | -1>(0),
    },
  ];
  return {
    element: document.createElement('div'),
    activeDescendantId: signal<string | undefined>(undefined),
    tabindex: signal<0 | -1>(-1),
    disabled: signal(false),
    items: signal(items),
    active: signal(items[0].identity),
    focused: signal<[HTMLElement | undefined]>([undefined]),
  } as ActiveDescendantState & { disabled: WritableSignal<boolean> };
}

describe('state machine', () => {
  it('should apply state machine to initial state', () => {
    const initial = getInitialState();
    const state = applyStateMachine(initial, getActiveDescendantStateMachine(), {
      focusin: new EventDispatcher<FocusEvent>(),
    });
    expect(state.activeDescendantId()).toBe('id1');
    expect(state.tabindex()).toBe(0);
    expect(state.items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in initial state after machine applied', () => {
    const initial = getInitialState();
    const state = applyStateMachine(initial, getActiveDescendantStateMachine(), {
      focusin: new EventDispatcher<FocusEvent>(),
    });
    expect(state.tabindex()).toBe(0);

    initial.disabled.set(true);
    expect(state.tabindex()).toBe(-1);
  });

  it('should apply a dynamic state machine', () => {
    const initial = getInitialState();
    const machine = signal(getActiveDescendantStateMachine());
    const state = applyDynamicStateMachine(initial, machine, {
      focusin: new EventDispatcher<FocusEvent>(),
    });
    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
    expect(state().items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in the dynamic state machine', () => {
    const initial = getInitialState();
    const machine = signal<StateMachine<ActiveDescendantState>>(getActiveDescendantStateMachine());
    const state = applyDynamicStateMachine(initial, machine, {
      focusin: new EventDispatcher<FocusEvent>(),
    });
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: () => 'test',
        tabindex: () => -1,
      },
      events: {},
    } as StateMachine<ActiveDescendantState, 'activeDescendantId' | 'tabindex'>);

    expect(state().activeDescendantId()).toBe('test');
    expect(state().tabindex()).toBe(-1);
  });

  it('should preserve state from previous machine that is not overwritten by the new machine', () => {
    const initial = getInitialState();
    const machine = signal<StateMachine<ActiveDescendantState>>(getActiveDescendantStateMachine());
    const state = applyDynamicStateMachine(initial, machine, {
      focusin: new EventDispatcher<FocusEvent>(),
    });
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: (_: unknown, prev: unknown) => prev,
      },
      events: {},
    } as StateMachine<ActiveDescendantState, 'activeDescendantId'>);

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
  });

  it('should compose event handlers', () => {
    const machine1 = getActiveDescendantStateMachine();
    const machine2 = getActiveDescendantStateMachine();
    const focusinSpy1 = spyOn(machine1.events, 'focusin');
    const focusinSpy2 = spyOn(machine2.events, 'focusin');
    const composedMachine = compose(machine1, machine2);
    expect(focusinSpy1).not.toHaveBeenCalled();
    expect(focusinSpy2).not.toHaveBeenCalled();

    composedMachine.events.focusin(undefined!, undefined!, undefined!);
    expect(focusinSpy1).toHaveBeenCalled();
    expect(focusinSpy2).toHaveBeenCalled();
  });
});

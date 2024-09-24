import { signal } from '@angular/core';
import {
  ActiveDescendantState,
  activeDescendantStateMachine,
} from '../behaviors2/active-descendant';
import { applyDynamicStateMachine, applyStateMachine, StateMachine } from './state-machine';

function getInitialState() {
  const items = [
    {
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
    active: signal(items[0]),
    focused: signal<HTMLElement | undefined>(undefined),
  };
}

describe('state machine', () => {
  it('should apply state machine to initial state', () => {
    const initial = getInitialState();
    const state = applyStateMachine(initial, activeDescendantStateMachine);
    expect(state.activeDescendantId()).toBe('id1');
    expect(state.tabindex()).toBe(0);
    expect(state.items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in initial state after machine applied', () => {
    const initial = getInitialState();
    const state = applyStateMachine(initial, activeDescendantStateMachine);
    expect(state.tabindex()).toBe(0);

    initial.disabled.set(true);
    expect(state.tabindex()).toBe(-1);
  });

  it('should apply a dynamic state machine', () => {
    const initial = getInitialState();
    const machine = signal(activeDescendantStateMachine);
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
    expect(state().items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in the dynamic state machine', () => {
    const initial = getInitialState();
    const machine = signal<StateMachine<ActiveDescendantState>>(activeDescendantStateMachine);
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: () => 'test',
        tabindex: () => -1,
      },
      events: {},
    });

    expect(state().activeDescendantId()).toBe('test');
    expect(state().tabindex()).toBe(-1);
  });

  it('should preserve state from previous machine that is not overwritten by the new machine', () => {
    const initial = getInitialState();
    const machine = signal<StateMachine<ActiveDescendantState>>(activeDescendantStateMachine);
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: (_: unknown, prev: unknown) => prev,
      },
      events: {},
    });

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
  });
});

import { signal } from '@angular/core';
import {
  ActiveDescendantItemState,
  ActiveDescendantState,
  activeDescendantStateMachine,
} from '../behaviors2/active-descendant';
import {
  applyDynamicStateMachine,
  applyStateMachine,
  MutableState,
  StateMachine,
} from './state-machine';

describe('state machine', () => {
  let items: MutableState<ActiveDescendantItemState>[];
  let initial: MutableState<ActiveDescendantState<ActiveDescendantItemState>>;

  beforeEach(() => {
    items = [
      {
        id: signal('id1'),
        tabindex: signal<0 | -1>(0),
      },
    ];
    initial = {
      activeDescendantId: signal<string | undefined>(undefined),
      tabindex: signal<0 | -1>(-1),
      disabled: signal(false),
      items: signal(items),
      active: signal(items[0]),
    };
  });

  it('should apply state machine to initial state', () => {
    const state = applyStateMachine(initial, activeDescendantStateMachine);
    expect(state.activeDescendantId()).toBe('id1');
    expect(state.tabindex()).toBe(0);
    expect(state.items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in initial state after machine applied', () => {
    const state = applyStateMachine(initial, activeDescendantStateMachine);
    expect(state.tabindex()).toBe(0);

    initial.disabled.set(true);
    expect(state.tabindex()).toBe(-1);
  });

  it('should apply a dynamic state machine', () => {
    const machine = signal<StateMachine<ActiveDescendantState<ActiveDescendantItemState>, any>>(
      activeDescendantStateMachine
    );
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
    expect(state().items()[0].tabindex()).toBe(-1);
  });

  it('should respond to changes in the dynamic state machine', () => {
    const machine = signal<StateMachine<ActiveDescendantState<ActiveDescendantItemState>, any>>(
      activeDescendantStateMachine
    );
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: () => 'test',
        tabindex: () => -1,
      },
      eventHandlers: {},
    } as any);

    expect(state().activeDescendantId()).toBe('test');
    expect(state().tabindex()).toBe(-1);
  });

  it('should preserve state from previous machine that is not overwritten by the new machine', () => {
    const machine = signal<StateMachine<ActiveDescendantState<ActiveDescendantItemState>, any>>(
      activeDescendantStateMachine
    );
    const state = applyDynamicStateMachine(initial, machine);
    expect(state().activeDescendantId()).toBe('id1');

    machine.set({
      transitions: {
        activeDescendantId: (_: unknown, prev: unknown) => prev,
      },
      eventHandlers: {},
    } as any);

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);
  });
});

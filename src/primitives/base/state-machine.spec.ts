import { signal } from '@angular/core';
import { ActiveDescendantItemState, ActiveDescendantState } from '../behaviors2/active-descendant';
import { connectStateMachines, StateMachine } from './state-machine';

describe('state machine', () => {
  it('should connect state transforms', () => {
    const items = [
      {
        id: signal('id1'),
        tabindex: signal<0 | -1>(0),
      },
    ];
    const initial = {
      activeDescendantId: signal(undefined),
      tabindex: signal<0 | -1>(-1),
      disabled: signal(false),
      items: signal(items),
      active: signal(undefined),
    };
    const machines = signal<StateMachine<ActiveDescendantState<ActiveDescendantItemState>>[]>([]);
    const state = connectStateMachines<ActiveDescendantState<ActiveDescendantItemState>>(
      initial,
      machines
    );

    expect(state().activeDescendantId()).toBe(undefined);
    expect(state().tabindex()).toBe(-1);

    machines.update((machines) => [
      ...machines,
      {
        transitions: {
          tabindex: (v) => (state().disabled() ? -1 : 0),
        },
      },
    ]);

    expect(state().tabindex()).toBe(0);

    initial.disabled.set(true);

    expect(state().tabindex()).toBe(-1);

    machines.update((machines) => [
      ...machines,
      {
        transitions: {
          disabled: () => false,
        },
      },
    ]);

    expect(state().tabindex()).toBe(0);
  });
});

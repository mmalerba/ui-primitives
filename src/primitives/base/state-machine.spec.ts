import { computed, signal, untracked } from '@angular/core';
import { createActiveDescendantStateMachine } from '../behaviors2/active-descendant';
import { connectStateMachines, StateMachine } from './state-machine';

describe('state machine', () => {
  it('should connect state transforms', () => {
    const options = signal({ activeDescendant: true });

    const items = [
      {
        id: signal('id1'),
        tabindex: signal<0 | -1>(0),
      },
    ];
    const initial = {
      activeDescendantId: signal<string | undefined>(undefined),
      tabindex: signal<0 | -1>(-1),
      disabled: signal(false),
      items: signal(items),
      active: signal(items[0]),
    };

    let prev = initial;

    // TODO: combine this into connectStateMachines
    const state = computed(() => {
      const machines = signal<StateMachine<typeof initial, any>[]>([]);
      const state = connectStateMachines(prev, machines);
      if (options().activeDescendant) {
        untracked(() => machines.set([createActiveDescendantStateMachine(state)]));
      }
      return (prev = untracked(() => state()));
    });

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(0);

    initial.disabled.set(true);

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(-1);

    options.set({ activeDescendant: false });

    expect(state().activeDescendantId()).toBe('id1');
    expect(state().tabindex()).toBe(-1);
  });
});

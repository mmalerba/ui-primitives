import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { Behavior } from './behavior';
import { writableDefault } from './defaults';

type Input = {
  activeIndex?: Signal<number>;
};

type State = {
  activeIndex: Signal<number>;
  disabled: Signal<boolean>;
};

type Model = {
  activeIndex: WritableSignal<number>;
};

type Events = 'click';

type Output = {
  items: Signal<{ active: Signal<boolean> }[]>;
};

const b: Behavior<Input, Model, State, Events, Output> = {
  createState: (input) => {
    const model = {
      activeIndex: writableDefault(input.activeIndex, -1),
    };
    const state = {
      activeIndex: model.activeIndex,
      disabled: computed(() => false),
    };
    return { state, model };
  },

  transform: {
    activeIndex: (state, activeIndex) => (state.disabled() ? -1 : activeIndex),
  },

  events: {
    click: (model, state) => {
      model.activeIndex.set(state.activeIndex() + 1);
    },
  },

  output: (state) => ({
    items: signal(
      Array.from({ length: 3 }, (_, idx) => ({ active: signal(state.activeIndex() === idx) }))
    ),
  }),
};

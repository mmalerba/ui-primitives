import { computed, signal } from '@angular/core';
import { createUiState, merge } from './base';

describe('merge', () => {
  it('should merge signals', () => {
    const a = signal('a');
    const b = signal('b');
    const s = merge(a, b);
    expect(s()).toBe('a');
    a.set('aa');
    expect(s()).toBe('aa');
    b.set('bb');
    expect(s()).toBe('bb');
    b.set('bbb');
    expect(s()).toBe('bbb');
    a.set('aaa');
    expect(s()).toBe('aaa');
  });

  it('should use first value when signals change simultaneously', () => {
    const a = signal('a');
    const b = signal('b');
    const s = merge(a, b);
    a.set('aa');
    b.set('bb');
    expect(s()).toBe('aa');
    b.set('bbb');
    a.set('aaa');
    expect(s()).toBe('aaa');
  });
});

describe('createUiState', () => {
  it('should update', () => {
    const state = createUiState({
      a: signal(1),
    });
    const computedState = computed(() => state.a() * 2);
    expect(computedState()).toBe(2);
    state.a.set(2);
    expect(computedState()).toBe(4);
    state.a = signal(3);
    expect(computedState()).toBe(6);
  });
});

import { signal } from '@angular/core';
import { createExtendableState } from './extendable-state';

describe('ExtendableState', () => {
  it('should pass through non-signal values', () => {
    const state = createExtendableState({ value: 0 });
    expect(state.value).toBe(0);
  });

  it('should allow getting signal values', () => {
    const state = createExtendableState({ value: signal(0) });
    expect(state.value()).toBe(0);
  });

  it('should allow setting signal values', () => {
    const state = createExtendableState({ value: signal(0) });
    state.value.set(1);
    expect(state.value()).toBe(1);
  });

  it('should allow extending signal values', () => {
    const origValue = signal(0);
    const state = createExtendableState({ value: origValue });
    state.value.extend((value) => value + 1);
    expect(state.value()).toBe(1);
    state.value.set(0);
    expect(state.value()).toBe(0);
    origValue.set(1);
    expect(state.value()).toBe(2);
  });

  it('should work with items', () => {
    const origItems = signal([{ value: signal(0) }]);
    const state = createExtendableState({ items: origItems });
    state.items.extend((items) =>
      items.map((item) => ({
        ...item,
        value: signal(item.value() + 1),
      }))
    );
    expect(state.items().map((item) => item.value())).toEqual([1]);
    origItems()[0].value.set(1);
    expect(state.items().map((item) => item.value())).toEqual([2]);
    origItems.update((items) => [...items, { value: signal(0) }]);
    expect(state.items().map((item) => item.value())).toEqual([2, 1]);
  });

  it('should work with nested extendable state', () => {
    const origItems = signal([createExtendableState({ value: signal(0) })]);
    const state = createExtendableState({ items: origItems });
    state.items.extend((items) =>
      items.map((item) =>
        createExtendableState({
          ...item,
          value: signal(item.value() + 1),
        })
      )
    );
    expect(state.items().map((item) => item.value())).toEqual([1]);
    origItems()[0].value.set(1);
    expect(state.items().map((item) => item.value())).toEqual([2]);
    origItems.update((items) => [...items, createExtendableState({ value: signal(0) })]);
    expect(state.items().map((item) => item.value())).toEqual([2, 1]);
    state.items()[1].value.extend((value) => value + 1);
    expect(state.items().map((item) => item.value())).toEqual([2, 2]);
  });
});

import { computed, Signal, signal } from '@angular/core';
import { applyTransform, composeTransforms, StateGraphTransform } from './graph';

describe('state graph', () => {
  it('transforms graph', () => {
    const g = {
      activeIndex: signal(0),
      selectedIndex: signal(0),
    };

    const t: StateGraphTransform<typeof g> = {
      selectedIndex: (g) => g.activeIndex(),
    };

    const gt = applyTransform(g, t);
    expect(gt.activeIndex()).toBe(0);
    expect(gt.selectedIndex()).toBe(0);

    g.activeIndex.set(1);
    expect(gt.activeIndex()).toBe(1);
    expect(gt.selectedIndex()).toBe(1);

    g.selectedIndex.set(2);
    expect(gt.activeIndex()).toBe(1);
    expect(gt.selectedIndex()).toBe(1);
  });

  it('transforms graph with items', () => {
    const g = {
      selectedIndices: signal<number[]>([]),
      items: signal(
        Array.from({ length: 3 }, () => ({
          selected: computed(() => false),
        }))
      ),
    };

    const t: StateGraphTransform<typeof g> = {
      items: (g, items) =>
        items.map((item, idx) => ({
          ...item,
          selected: computed(() => g.selectedIndices().includes(idx)),
        })),
    };

    const gt = applyTransform(g, t);
    expect(gt.items().map((i) => i.selected())).toEqual([false, false, false]);

    const items = gt.items();
    g.selectedIndices.set([0, 1]);
    expect(gt.items().map((i) => i.selected())).toEqual([true, true, false]);
    expect(gt.items()).toBe(items);
    expect(gt.items()[0]).toBe(items[0]);
  });

  it('composes transforms', () => {
    const g = {
      activeIndex: signal(1),
      items: computed(() =>
        Array.from({ length: 3 }, () => ({
          selected: computed(() => false),
          tabindex: computed(() => -1),
        }))
      ),
    };

    const t1: StateGraphTransform<{
      activeIndex: Signal<number>;
      items: Signal<{ selected: Signal<boolean> }[]>;
    }> = {
      items: (g, items) =>
        items.map((item, idx) => ({
          ...item,
          selected: computed(() => idx === g.activeIndex()),
        })),
    };

    const t2: StateGraphTransform<{
      activeIndex: Signal<number>;
      items: Signal<{ tabindex: Signal<number> }[]>;
    }> = {
      items: (g, items) =>
        items.map((item, idx) => ({
          ...item,
          tabindex: computed(() => (idx === g.activeIndex() ? 0 : -1)),
        })),
    };

    const t = composeTransforms(t1, t2);

    const gt = applyTransform(g, t);
    expect(gt.activeIndex()).toBe(1);
    expect(gt.items().map((i) => ({ selected: i.selected(), tabindex: i.tabindex() }))).toEqual([
      {
        selected: false,
        tabindex: -1,
      },
      {
        selected: true,
        tabindex: 0,
      },
      {
        selected: false,
        tabindex: -1,
      },
    ]);
  });

  // This case is why I'm tempted to create something like this in the first place.
  it('composes transforms with non-cyclical cross-dependencies', () => {
    const g = {
      a: computed(() => 0),
      b: computed(() => 0),
      c: computed(() => 0),
      d: computed(() => 0),
    };

    const t1: StateGraphTransform<typeof g> = {
      b: (g) => g.a() + 1, // dep on t2
      d: (g) => g.c() + 1, // dep on t2
    };

    const t2: StateGraphTransform<typeof g> = {
      a: () => 1,
      c: (g) => g.b() + 1, // dep on t1
    };

    const t = composeTransforms(t1, t2);

    const gt = applyTransform(g, t);
    expect(gt.a()).toBe(1);
    expect(gt.b()).toBe(2);
    expect(gt.c()).toBe(3);
    expect(gt.d()).toBe(4);
  });

  // But this is why I'm reluctant to use this solution...
  it('explodes when composed transform contains cycles', () => {
    const g = {
      a: computed(() => 0),
      b: computed(() => 0),
    };

    const t1: StateGraphTransform<typeof g> = {
      a: (g) => g.b(),
    };

    const t2: StateGraphTransform<typeof g> = {
      b: (g) => g.a(),
    };

    const t = composeTransforms(t1, t2);

    const gt = applyTransform(g, t);
    expect(() => gt.a()).toThrowError();
  });
});

import { signal } from '@angular/core';
import { patchableSignal } from './patchable-signal';

describe('patchableSignal', () => {
  it('patch should be reflected in existing references', () => {
    const p = patchableSignal(signal(0));
    p.patch((v) => v + 1);
    expect(p()).toBe(1);
  });

  it('should update when parent signal changes', () => {
    const s = signal(0);
    const p = patchableSignal(s);
    p.patch((v) => v + 1);
    s.set(1);
    expect(p()).toBe(2);
  });

  it('should update when patch signal changes', () => {
    const p = patchableSignal(signal(0));
    const patch = p.patch((v) => v + 1);
    patch.set(3);
    expect(p()).toBe(3);
  });

  it('should keep last computed patched value when patch is disconnected', () => {
    const connected = signal(true);
    const p = patchableSignal(signal(0));
    p.patch((v) => v + 1, { connected });
    expect(p()).toBe(1);
    connected.set(false);
    expect(p()).toBe(1);
  });

  it('should keep last expilcit patched value when patch is disconnected', () => {
    const connected = signal(true);
    const p = patchableSignal(signal(0));
    const patch = p.patch((v) => v + 1, { connected });
    patch.set(5);
    expect(p()).toBe(5);
    connected.set(false);
    expect(p()).toBe(5);
  });

  it('should not recompute patch after it is disconnected', () => {
    const connected = signal(true);
    const s = signal(0);
    const p = patchableSignal(s);
    const patch = p.patch((v) => v + 1, { connected });
    expect(p()).toBe(1);
    connected.set(false);
    expect(p()).toBe(1);
    s.set(10);
    expect(p()).toBe(10);
  });

  it('should not run patch computation after it is disconnected', () => {
    const connected = signal(true);
    const s = signal(0);
    const p = patchableSignal(s);
    p.patch((v) => v + 1, { connected });
    expect(p()).toBe(1);
    connected.set(false);
    expect(p()).toBe(1);
    s.set(10);
    expect(p()).toBe(10);
  });

  it('should patch multiple times', () => {
    const connected = signal(true);
    const s = signal(0);
    const p = patchableSignal(s);
    p.patch((v) => v + 1, { connected });
    p.patch((v) => v * 2);
    expect(p()).toBe(2);
    connected.set(false);
    expect(p()).toBe(2);
    s.set(3);
    expect(p()).toBe(6);
  });

  it('should recompute when patch computation signals change', () => {
    const s = signal(0);
    const o = signal(0);
    const p = patchableSignal(s);
    p.patch((v) => v + o());
    expect(p()).toBe(0);
    o.set(1);
    expect(p()).toBe(1);
  });
});

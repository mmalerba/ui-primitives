import {
  effect,
  EffectRef,
  inject,
  Injector,
  runInInjectionContext,
  Signal,
  untracked,
} from '@angular/core';

export function runSyncFns(instance: Signal<{ syncFns: (() => void)[] } | undefined>) {
  const injector = inject(Injector);
  effect((onCleanup) => {
    const syncFns = instance()?.syncFns;
    const effectRefs: EffectRef[] = [];
    for (const syncFn of syncFns ?? []) {
      effectRefs.push(untracked(() => runInInjectionContext(injector, () => effect(syncFn))));
    }

    onCleanup(() => {
      for (const effectRef of effectRefs) {
        effectRef.destroy();
      }
    });
  });
}

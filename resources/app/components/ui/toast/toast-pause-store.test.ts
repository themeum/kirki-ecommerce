import { describe, expect, it, vi } from 'vitest';

import { createToastPauseStore } from '@/components/ui/toast/toast-pause-store';

describe('createToastPauseStore', () => {
  it('is not paused at the start', () => {
    expect(createToastPauseStore().isPaused()).toBe(false);
  });

  it('pauses and resumes', () => {
    const store = createToastPauseStore();

    store.setPaused(true);

    expect(store.isPaused()).toBe(true);

    store.setPaused(false);

    expect(store.isPaused()).toBe(false);
  });

  it('notifies subscribers only when the paused state changes', () => {
    const store = createToastPauseStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setPaused(true);
    store.setPaused(true);
    store.setPaused(false);

    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.setPaused(true);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});

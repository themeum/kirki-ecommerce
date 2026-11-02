import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMigrationRunner } from '@/features/migration/hooks/use-migration-runner';
import type {
  MigrationGroupState,
  MigrationProgress,
  MigrationRun,
} from '@/features/migration/schemas/catalog/migration';

const { startMutateAsync, chunkMutateAsync } = vi.hoisted(() => ({
  startMutateAsync: vi.fn(),
  chunkMutateAsync: vi.fn(),
}));

vi.mock('@/features/migration/services/migration', () => ({
  useStartMigrationMutation: () => ({ mutateAsync: startMutateAsync }),
  useRunMigrationChunkMutation: () => ({ mutateAsync: chunkMutateAsync }),
}));

const groupState = (done: number): MigrationGroupState => ({
  label: 'Products',
  status: done >= 70 ? 'done' : 'running',
  cursor: done,
  total: 70,
  done,
  created: done,
  reused: 0,
  skipped: 0,
});

const run = (id = 5): MigrationRun => ({
  id,
  source: 'woocommerce',
  status: 'pending',
  groups: { products: { ...groupState(0), status: 'pending' } },
  skipped_items: [],
  last_error: null,
});

const progress = (done: number, notes: string[] = []): MigrationProgress => ({
  run_id: 5,
  status: done >= 70 ? 'done' : 'running',
  done: done >= 70,
  group: done >= 70 ? null : 'products',
  label: done >= 70 ? null : 'Products',
  range_from: done - 29,
  range_to: done,
  group_finished: false,
  groups: { products: groupState(done) },
  notes,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

const renderRunner = () => renderHook(() => useMigrationRunner({ source: 'woocommerce' }), { wrapper });

describe('useMigrationRunner', () => {
  beforeEach(() => {
    startMutateAsync.mockReset();
    chunkMutateAsync.mockReset();
  });

  it('keeps the same groups object across renders while idle', () => {
    const { result, rerender } = renderRunner();
    const first = result.current.groups;

    rerender();

    expect(result.current.groups).toBe(first);
  });

  it('starts a run and requests one chunk after another until it is done', async () => {
    startMutateAsync.mockResolvedValue(run());
    chunkMutateAsync
      .mockResolvedValueOnce(progress(30, ['first note']))
      .mockResolvedValueOnce(progress(60))
      .mockResolvedValueOnce(progress(70, ['second note']));
    const { result } = renderRunner();

    await act(() => result.current.start(['products']));

    expect(startMutateAsync).toHaveBeenCalledWith({ source: 'woocommerce', groups: ['products'] });
    expect(chunkMutateAsync).toHaveBeenCalledTimes(3);
    expect(chunkMutateAsync).toHaveBeenCalledWith(5);
    expect(result.current.phase).toBe('done');
    expect(result.current.notes).toEqual(['first note', 'second note']);
    expect(result.current.groups.products.done).toBe(70);
  });

  it('stops on an error and keeps the run so it can be resumed from the saved position', async () => {
    startMutateAsync.mockResolvedValue(run());
    chunkMutateAsync
      .mockResolvedValueOnce(progress(30))
      .mockRejectedValueOnce({ message: 'The server went away' });
    const { result } = renderRunner();

    await act(() => result.current.start(['products']));

    expect(result.current.phase).toBe('failed');
    expect(result.current.errorMessage).toBe('The server went away');
    expect(chunkMutateAsync).toHaveBeenCalledTimes(2);

    chunkMutateAsync.mockResolvedValueOnce(progress(60)).mockResolvedValueOnce(progress(70));
    await act(() => result.current.resume());

    expect(startMutateAsync).toHaveBeenCalledTimes(1);
    expect(chunkMutateAsync).toHaveBeenCalledTimes(4);
    expect(result.current.phase).toBe('done');
    expect(result.current.errorMessage).toBeNull();
  });

  it('resumes an unfinished run that was found after a page reload', async () => {
    chunkMutateAsync.mockResolvedValueOnce(progress(70));
    const { result } = renderRunner();

    await act(() => result.current.resume(run(9)));

    expect(startMutateAsync).not.toHaveBeenCalled();
    expect(chunkMutateAsync).toHaveBeenCalledWith(9);
    await waitFor(() => expect(result.current.phase).toBe('done'));
  });

  it('fails when the run cannot be started and requests no chunk', async () => {
    startMutateAsync.mockRejectedValue({ message: 'Not allowed' });
    const { result } = renderRunner();

    await act(() => result.current.start(['products']));

    expect(result.current.phase).toBe('failed');
    expect(result.current.errorMessage).toBe('Not allowed');
    expect(chunkMutateAsync).not.toHaveBeenCalled();
  });

  it('restores a finished run found after a reload', () => {
    const { result } = renderRunner();

    act(() => result.current.restore({ ...run(9), status: 'done' }));

    expect(result.current.phase).toBe('done');
    expect(result.current.run?.id).toBe(9);
  });
});

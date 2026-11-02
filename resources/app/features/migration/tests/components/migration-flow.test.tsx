import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MigrationFlow from '@/features/migration/components/migration-flow';
import type {
  MigrationGroupState,
  MigrationProgress,
  MigrationRun,
} from '@/features/migration/schemas/catalog/migration';

type MockState = {
  scan: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    data: unknown;
    refetch: () => void;
  };
  latestRun: { isPending: boolean; data: unknown };
  savedRun: { data: unknown };
  start: ReturnType<typeof vi.fn>;
  chunk: ReturnType<typeof vi.fn>;
  startRevert: ReturnType<typeof vi.fn>;
  revertChunk: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(
  (): MockState => ({
    scan: { isPending: false, isError: false, error: null, data: undefined, refetch: vi.fn() },
    latestRun: { isPending: false, data: null },
    savedRun: { data: undefined },
    start: vi.fn(),
    chunk: vi.fn(),
    startRevert: vi.fn(),
    revertChunk: vi.fn(),
  }),
);

vi.mock('@/features/migration/services/migration', () => ({
  useMigrationScanQuery: () => mocks.scan,
  useLatestMigrationRunQuery: () => mocks.latestRun,
  useMigrationRunQuery: () => mocks.savedRun,
  useStartMigrationMutation: () => ({ mutateAsync: mocks.start }),
  useRunMigrationChunkMutation: () => ({ mutateAsync: mocks.chunk }),
  useStartRevertMutation: () => ({ mutateAsync: mocks.startRevert }),
  useRunRevertChunkMutation: () => ({ mutateAsync: mocks.revertChunk }),
}));

const scanData = {
  source: 'woocommerce',
  groups: [
    { id: 'products', label: 'Products', description: 'Products with their variants.', count: 100 },
    { id: 'orders', label: 'Orders', description: 'Past orders.', count: 1000 },
    { id: 'settings', label: 'Settings', description: '', count: 3 },
  ],
  extensions: [{ slug: 'woocommerce-subscriptions', label: 'WooCommerce Subscriptions', status: 'not_migrated' }],
};

const groupState = (done: number, total = 60): MigrationGroupState => ({
  label: 'Products',
  status: done >= total ? 'done' : 'running',
  cursor: done,
  total,
  done,
  created: done,
  reused: 0,
  skipped: 0,
});

const progress = (done: number, isDone = false): MigrationProgress => ({
  run_id: 5,
  status: isDone ? 'done' : 'running',
  done: isDone,
  group: isDone ? null : 'products',
  label: isDone ? null : 'Products',
  range_from: done - 29,
  range_to: done,
  group_finished: false,
  groups: { products: groupState(done) },
  notes: [],
});

const unfinishedRun: MigrationRun = {
  id: 9,
  source: 'woocommerce',
  status: 'failed',
  groups: { products: { ...groupState(30), status: 'failed' } },
  skipped_items: [],
  last_error: 'Stopped',
};

const onProgressChange = vi.fn();
const onSkip = vi.fn();
const onFinish = vi.fn();

const renderFlow = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MigrationFlow
        source="woocommerce"
        sourceLabel="WooCommerce"
        onProgressChange={onProgressChange}
        onSkip={onSkip}
        onFinish={onFinish}
      />
    </QueryClientProvider>,
  );

describe('migration flow', () => {
  beforeEach(() => {
    mocks.scan.isPending = false;
    mocks.scan.isError = false;
    mocks.scan.error = null;
    mocks.scan.data = scanData;
    mocks.latestRun.isPending = false;
    mocks.latestRun.data = null;
    mocks.savedRun.data = undefined;
    mocks.start.mockReset();
    mocks.chunk.mockReset();
    mocks.startRevert.mockReset();
    mocks.revertChunk.mockReset();
    onProgressChange.mockReset();
    onSkip.mockReset();
    onFinish.mockReset();
  });

  afterEach(cleanup);

  it('shows a skeleton while the store is scanned and keeps Migrate disabled', () => {
    mocks.scan.isPending = true;
    mocks.scan.data = undefined;
    renderFlow();

    expect(screen.getByText('Checking your store…')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Migrate' })).toBeDisabled();
  });

  it('lists the groups with their counts, all checked, and the add-ons that are not migrated', () => {
    renderFlow();

    expect(screen.getByRole('checkbox', { name: 'Products (100)' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Orders (1000)' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Settings (3)' })).toBeChecked();
    expect(screen.getByText(/WooCommerce Subscriptions/)).toBeInTheDocument();
  });

  it('leaves the migration when Skip is pressed', () => {
    renderFlow();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(mocks.start).not.toHaveBeenCalled();
  });

  it('disables Migrate when every group is unchecked', () => {
    renderFlow();

    ['Products (100)', 'Orders (1000)', 'Settings (3)'].forEach((name) =>
      fireEvent.click(screen.getByRole('checkbox', { name })),
    );

    expect(screen.getByRole('button', { name: 'Migrate' })).toBeDisabled();
  });

  it('migrates only the checked groups, reports the progress and ends at the dashboard button', async () => {
    let finishFirstChunk: (value: MigrationProgress) => void = () => undefined;
    let finishLastChunk: (value: MigrationProgress) => void = () => undefined;
    mocks.start.mockResolvedValue({ ...unfinishedRun, status: 'pending' });
    mocks.chunk
      .mockReturnValueOnce(new Promise<MigrationProgress>((resolve) => (finishFirstChunk = resolve)))
      .mockReturnValueOnce(new Promise<MigrationProgress>((resolve) => (finishLastChunk = resolve)));
    renderFlow();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Orders (1000)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Migrate' }));

    await waitFor(() =>
      expect(onProgressChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ percent: 0, message: 'Preparing the migration…' }),
      ),
    );
    expect(mocks.start).toHaveBeenCalledWith({ source: 'woocommerce', groups: ['products', 'settings'] });

    finishFirstChunk(progress(30));
    await waitFor(() =>
      expect(onProgressChange).toHaveBeenCalledWith(
        expect.objectContaining({ percent: 50, message: 'Migrating Products 1-30 of 60' }),
      ),
    );

    finishLastChunk(progress(60, true));

    expect(await screen.findByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(onProgressChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ percent: 100, message: 'Migration complete' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go to dashboard' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('stops on an error and continues from the saved position when Retry is pressed', async () => {
    mocks.start.mockResolvedValue({ ...unfinishedRun, status: 'pending' });
    mocks.chunk
      .mockResolvedValueOnce(progress(30))
      .mockRejectedValueOnce({ message: 'The server went away' })
      .mockResolvedValueOnce(progress(60, true));
    renderFlow();

    fireEvent.click(screen.getByRole('button', { name: 'Migrate' }));

    expect(await screen.findByText('The server went away')).toBeInTheDocument();
    expect(mocks.chunk).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.chunk).toHaveBeenCalledTimes(3);
  });

  it('shows Retry for an earlier migration that did not finish and continues it', async () => {
    mocks.latestRun.data = unfinishedRun;
    mocks.chunk.mockResolvedValueOnce(progress(60, true));
    renderFlow();

    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(mocks.chunk).toHaveBeenCalledWith(9));
    expect(mocks.start).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
  });

  it('shows the completed summary with Revert and Go to dashboard after a reload', async () => {
    mocks.latestRun.data = {
      ...unfinishedRun,
      status: 'done',
      groups: { products: groupState(60) },
    };
    renderFlow();

    expect(await screen.findByText('Migration complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revert' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to dashboard' })).toBeInTheDocument();
    expect(mocks.chunk).not.toHaveBeenCalled();
  });

  it('reverts a completed migration after confirmation and returns to the scan step', async () => {
    mocks.latestRun.data = {
      ...unfinishedRun,
      status: 'done',
      groups: { products: groupState(60) },
    };
    mocks.startRevert.mockResolvedValue({ ...unfinishedRun, status: 'reverting' });
    mocks.revertChunk.mockResolvedValueOnce({
      run_id: 9,
      status: 'reverted',
      done: true,
      total: 60,
      removed: 59,
      kept: 1,
    });
    renderFlow();

    fireEvent.click(await screen.findByRole('button', { name: 'Revert' }));
    expect(mocks.startRevert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));

    expect(await screen.findByRole('button', { name: 'Migrate' })).toBeInTheDocument();
    expect(mocks.startRevert).toHaveBeenCalledWith(9);
    expect(mocks.revertChunk).toHaveBeenCalledWith(9);
    expect(screen.getByText('The migration was reverted. 1 record was kept because it is in use.')).toBeInTheDocument();
  });

  it('lists the skipped items of the finished run', async () => {
    mocks.start.mockResolvedValue({ ...unfinishedRun, status: 'pending' });
    mocks.chunk.mockResolvedValueOnce(progress(60, true));
    mocks.savedRun.data = {
      ...unfinishedRun,
      skipped_items: [{ group: 'coupons', source_id: 12, reason: 'The discount type is not supported.' }],
    };
    renderFlow();

    fireEvent.click(screen.getByRole('button', { name: 'Migrate' }));

    expect(await screen.findByText('coupons #12: The discount type is not supported.')).toBeInTheDocument();
    expect(screen.getByText('1 thing to review')).toBeInTheDocument();
  });

  it('shows the scan error with a retry action', () => {
    mocks.scan.isPending = false;
    mocks.scan.isError = true;
    mocks.scan.error = { message: 'Scan failed' };
    mocks.scan.data = undefined;
    renderFlow();

    expect(screen.getByText('Scan failed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mocks.scan.refetch).toHaveBeenCalledTimes(1);
  });
});

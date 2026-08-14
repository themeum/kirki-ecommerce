import type { ColumnDef } from '@tanstack/react-table';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import type { DataTableProps } from '@/components/data-table/data-table';
import DataTable from '@/components/data-table/data-table';
import type { DataTableItem } from '@/components/data-table/types';
import { noop } from '@/utils/function';

type Item = DataTableItem & {
  id: number;
  name: string;
  status: string;
};

const items: Item[] = [
  { id: 1, name: 'Alpha', status: 'active' },
  { id: 2, name: 'Bravo', status: 'inactive' },
];

const columns: ColumnDef<Item>[] = [
  { id: 'name', accessorKey: 'name', header: 'Name' },
  { id: 'status', accessorKey: 'status', header: 'Status', enableSorting: false },
];

type Updater<T> = T | ((old: T) => T);

const applyUpdater = <T,>(updater: Updater<T>, old: T): T =>
  typeof updater === 'function' ? (updater as (old: T) => T)(old) : updater;

const baseProps = (overrides: Partial<DataTableProps<Item>> = {}): DataTableProps<Item> => ({
  data: items,
  columns,
  pageCount: 5,
  pagination: { pageIndex: 0, pageSize: 10 },
  onPaginationChange: noop,
  sorting: [],
  onSortingChange: noop,
  ...overrides,
});

afterEach(() => {
  cleanup();
});

describe('DataTable', () => {
  it('renders outside any router', () => {
    render(<DataTable {...baseProps()} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

describe('DataTable loading', () => {
  it('replaces rows with a spinner while keeping headers, toolbar, filter bar and an inert pagination bar', () => {
    render(
      <DataTable
        {...baseProps()}
        isLoading
        toolbar={<div>My Toolbar</div>}
        filterBar={<div>My Filter Bar</div>}
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('My Toolbar')).toBeInTheDocument();
    expect(screen.getByText('My Filter Bar')).toBeInTheDocument();

    const pageTwo = screen.getByRole('button', { name: '2' });
    expect(pageTwo).toBeDisabled();
  });
});

describe('DataTable empty state', () => {
  it('shows the default empty state when there are no rows and nothing is loading', () => {
    render(<DataTable {...baseProps({ data: [] })} />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows a supplied empty state instead of the default', () => {
    render(<DataTable {...baseProps({ data: [], emptyState: <div>Nothing here</div> })} />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });

  it('shows the spinner instead of the empty state while loading with no rows', () => {
    render(<DataTable {...baseProps({ data: [], isLoading: true })} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });
});

describe('DataTable paging', () => {
  it('reports a 0-based pageIndex and leaves rows unchanged until new data arrives', () => {
    const onPaginationChange = vi.fn();
    const pagination = { pageIndex: 0, pageSize: 10 };

    render(<DataTable {...baseProps({ pagination, onPaginationChange })} />);

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(onPaginationChange).toHaveBeenCalledTimes(1);
    const [updater] = onPaginationChange.mock.calls[0] as [Updater<typeof pagination>];
    expect(applyUpdater(updater, pagination).pageIndex).toBe(1);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

describe('DataTable sorting', () => {
  it('reports the sortable column id when its header is activated', () => {
    const onSortingChange = vi.fn();

    render(<DataTable {...baseProps({ onSortingChange })} />);

    fireEvent.click(screen.getByText('Name'));

    expect(onSortingChange).toHaveBeenCalledTimes(1);
    const [updater] = onSortingChange.mock.calls[0] as [Updater<{ id: string; desc: boolean }[]>];
    expect(applyUpdater(updater, [])).toEqual([{ id: 'name', desc: false }]);
  });

  it('renders no sort affordance and does not report for a non-sortable column', () => {
    const onSortingChange = vi.fn();

    render(<DataTable {...baseProps({ onSortingChange })} />);

    fireEvent.click(screen.getByText('Status'));

    expect(onSortingChange).not.toHaveBeenCalled();
  });
});

describe('DataTable selection', () => {
  it('renders no selection column unless enableRowSelection is set', () => {
    render(<DataTable {...baseProps()} />);

    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('reports the selected entity id, keeps selection across a reordered refresh, and shows the indeterminate header state', () => {
    const onRowSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable {...baseProps({ enableRowSelection: true, onRowSelectionChange })} />,
    );

    const alphaRow = screen.getByText('Alpha').closest('tr');
    const alphaCheckbox = within(alphaRow as HTMLElement).getByRole('checkbox');

    fireEvent.click(alphaCheckbox);

    expect(onRowSelectionChange).toHaveBeenLastCalledWith({
      selectedIds: ['1'],
      isAllMatchingSelected: false,
      selectedCount: 1,
    });

    const [headerCheckbox] = screen.getAllByRole('checkbox');
    expect(headerCheckbox).toBePartiallyChecked();

    rerender(
      <DataTable
        {...baseProps({
          data: [items[1], items[0]],
          enableRowSelection: true,
          onRowSelectionChange,
        })}
      />,
    );

    const reorderedAlphaRow = screen.getByText('Alpha').closest('tr');
    expect(within(reorderedAlphaRow as HTMLElement).getByRole('checkbox')).toBeChecked();
  });
});

describe('DataTable select-all-matching', () => {
  beforeAll(() => {
    window.HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    global.ResizeObserver = class {
      observe = noop;
      unobserve = noop;
      disconnect = noop;
    };
  });

  it('withholds the offer when the total does not exceed the rows shown', () => {
    render(
      <DataTable
        {...baseProps({ enableRowSelection: true, total: items.length, onRowSelectionChange: noop })}
      />,
    );

    fireEvent.click(within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox'));

    expect(screen.queryByText(/Select all/)).not.toBeInTheDocument();
  });

  it('reports isAllMatchingSelected with the total as selectedCount, and passes both to a bulk action', async () => {
    const onRowSelectionChange = vi.fn();
    const onBulkApply = vi.fn().mockResolvedValue(undefined);

    render(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          total: 20,
          onRowSelectionChange,
          bulkActionOptions: [{ value: 'delete', title: 'Delete' }],
          onBulkApply,
          hidePagination: true,
        })}
      />,
    );

    fireEvent.click(within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox'));

    fireEvent.click(screen.getByText('Select all 20 items'));

    expect(onRowSelectionChange).toHaveBeenLastCalledWith({
      selectedIds: [],
      isAllMatchingSelected: true,
      selectedCount: 20,
    });

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(onBulkApply).toHaveBeenCalledTimes(1));
    expect(onBulkApply).toHaveBeenCalledWith('delete', {
      selectedIds: [],
      isAllMatchingSelected: true,
      selectedCount: 20,
    });

    await waitFor(() =>
      expect(onRowSelectionChange).toHaveBeenLastCalledWith({
        selectedIds: [],
        isAllMatchingSelected: false,
        selectedCount: 0,
      }),
    );
  });
});

describe('DataTable selection lifecycle', () => {
  it('clears the selection when selectionResetKey changes but not when the page changes', () => {
    const onRowSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable
        {...baseProps({ enableRowSelection: true, onRowSelectionChange, selectionResetKey: 'a' })}
      />,
    );

    fireEvent.click(within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox'));
    expect(onRowSelectionChange).toHaveBeenLastCalledWith({
      selectedIds: ['1'],
      isAllMatchingSelected: false,
      selectedCount: 1,
    });

    rerender(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          onRowSelectionChange,
          selectionResetKey: 'a',
          pagination: { pageIndex: 1, pageSize: 10 },
        })}
      />,
    );

    expect(within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox')).toBeChecked();

    rerender(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          onRowSelectionChange,
          selectionResetKey: 'b',
          pagination: { pageIndex: 1, pageSize: 10 },
        })}
      />,
    );

    expect(within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox')).not.toBeChecked();
  });
});

describe('DataTable pinning and visibility', () => {
  it('applies sticky positioning to a pinned column', () => {
    // Emotion's `scoped()` styles only take effect under this ancestor selector
    // (see theme/mixins.ts's APP_ROOT_SELECTOR), which the real app always mounts
    // inside; reproduce it here so the computed style assertion below is meaningful.
    render(<DataTable {...baseProps({ columnPinning: { right: ['status'] } })} />, {
      container: (() => {
        const wpbody = document.createElement('div');
        wpbody.id = 'wpbody-content';
        const root = document.createElement('div');
        root.className = 'kirki-ecommerce-root';
        wpbody.appendChild(root);
        document.body.appendChild(wpbody);
        return root;
      })(),
    });

    const cell = screen.getByText('active').closest('td') as HTMLElement;

    expect(getComputedStyle(cell).position).toBe('sticky');
  });

  it('renders no header or cells for a hidden column, and spans only visible columns while loading', () => {
    render(<DataTable {...baseProps({ columnVisibility: { status: false }, isLoading: true })} />);

    expect(screen.queryByText('Status')).not.toBeInTheDocument();

    const loadingCell = screen.getByRole('status').closest('td');
    expect(loadingCell).toHaveAttribute('colspan', '1');
  });
});

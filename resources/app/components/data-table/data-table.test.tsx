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

/*
 * Display columns with no accessorKey, matching every real call site. TanStack's
 * getCanSort() is false without an accessorFn, so an accessor-backed fixture
 * would hide a header that never becomes sortable in the app.
 */
const columns: ColumnDef<Item>[] = [
  { id: 'name', header: 'Name', enableSorting: true, cell: ({ row }) => row.original.name },
  { id: 'status', header: 'Status', cell: ({ row }) => row.original.status },
];

type Updater<T> = T | ((old: T) => T);

const applyUpdater = <T,>(updater: Updater<T>, old: T): T =>
  typeof updater === 'function' ? (updater as (old: T) => T)(old) : updater;

const baseProps = (overrides: Partial<DataTableProps<Item>> = {}): DataTableProps<Item> => ({
  tableId: 'test-table',
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
  vi.restoreAllMocks();
  // Column visibility persists per tableId, so it would otherwise leak between tests.
  window.localStorage.clear();
});

const asRect = (width: number, height: number) =>
  ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

// jsdom reports every box as zero-sized, so the measurements have to be stubbed.
const stubLayout = (columnWidths: Record<string, number>, rowHeight: number) => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const columnId = this.dataset.columnId;

    if (columnId) {
      return asRect(columnWidths[columnId] ?? 0, 42);
    }

    return asRect(0, rowHeight);
  });
};

describe('DataTable', () => {
  it('renders outside any router', () => {
    render(<DataTable {...baseProps()} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

describe('DataTable loading', () => {
  it('replaces only the rows with skeletons, keeping the headers, toolbar and an inert pagination bar', () => {
    render(<DataTable {...baseProps()} isLoading toolbar={<div>My Toolbar</div>} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('My Toolbar')).toBeInTheDocument();

    const pageTwo = screen.getByRole('button', { name: '2' });
    expect(pageTwo).toBeDisabled();
  });

  it('drops aria-busy and restores the rows once loading finishes', () => {
    render(<DataTable {...baseProps()} />);

    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('renders one skeleton row per row that was on screen, and one skeleton cell per visible column', () => {
    render(<DataTable {...baseProps()} isLoading />);

    const bodyRows = screen.getByRole('table').querySelectorAll('tbody tr');

    expect(bodyRows).toHaveLength(items.length);
    expect(bodyRows[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(columns.length);
  });

  it('falls back to the page size when there are no previous rows to replace', () => {
    render(<DataTable {...baseProps({ data: [], pagination: { pageIndex: 0, pageSize: 7 } })} isLoading />);

    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(7);
  });

  it('reserves an explicit height on every placeholder row so the rows do not collapse', () => {
    render(<DataTable {...baseProps()} isLoading />);

    const bodyRows = screen.getByRole('table').querySelectorAll<HTMLElement>('tbody tr');

    bodyRows.forEach((row) => {
      expect(row.style.height).toBe('58px');
    });
  });

  it('holds the column widths and row heights steady while the rows are replaced', () => {
    stubLayout({ name: 300, status: 120 }, 64);

    const { rerender } = render(<DataTable {...baseProps()} />);
    rerender(<DataTable {...baseProps({ isLoading: true })} />);

    const table = screen.getByRole('table');
    const headerCells = table.querySelectorAll<HTMLElement>('thead th');

    expect(table.style.tableLayout).toBe('fixed');
    expect(headerCells[0].style.width).toBe('300px');
    expect(headerCells[1].style.width).toBe('120px');
    table.querySelectorAll<HTMLElement>('tbody tr').forEach((row) => {
      expect(row.style.height).toBe('64px');
    });
  });

  it('leaves the layout to the browser on a first load, with nothing measured yet', () => {
    stubLayout({ name: 300, status: 120 }, 64);

    render(<DataTable {...baseProps({ isLoading: true })} />);

    const table = screen.getByRole('table');

    expect(table.style.tableLayout).toBe('');
    expect(table.querySelectorAll<HTMLElement>('thead th')[0].style.width).toBe('');
  });

  it('shows the sortable header but ignores clicks while a request is in flight', () => {
    const onSortingChange = vi.fn();

    render(<DataTable {...baseProps({ onSortingChange })} isLoading />);

    fireEvent.click(screen.getByText('Name'));

    expect(onSortingChange).not.toHaveBeenCalled();
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

  it('shows skeletons instead of the empty state while loading with no rows', () => {
    render(<DataTable {...baseProps({ data: [], isLoading: true })} />);

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
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

  it('reports no sort at all when a descending column header is activated again', () => {
    const onSortingChange = vi.fn();

    render(
      <DataTable {...baseProps({ sorting: [{ id: 'name', desc: true }], onSortingChange })} />,
    );

    fireEvent.click(screen.getByText('Name'));

    const [updater] = onSortingChange.mock.calls[0] as [Updater<{ id: string; desc: boolean }[]>];
    expect(applyUpdater(updater, [{ id: 'name', desc: true }])).toEqual([]);
  });

  it('shows both arrows unsorted, one up arrow ascending and one down arrow descending', () => {
    const arrowsIn = (header: HTMLElement) =>
      Array.from(header.querySelectorAll('path')).map((path) => path.getAttribute('d'));

    const nameHeader = () => screen.getByText('Name').closest('th') as HTMLElement;

    const { rerender } = render(<DataTable {...baseProps()} />);
    expect(arrowsIn(nameHeader())).toHaveLength(2);

    rerender(<DataTable {...baseProps({ sorting: [{ id: 'name', desc: false }] })} />);
    expect(arrowsIn(nameHeader())).toEqual(['M4 11H12L8 5L4 11Z']);

    rerender(<DataTable {...baseProps({ sorting: [{ id: 'name', desc: true }] })} />);
    expect(arrowsIn(nameHeader())).toEqual(['M4 5H12L8 11L4 5Z']);
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
          bulkActions: [
            { value: 'delete', title: 'Delete' },
            { value: 'archive', title: 'Archive' },
          ],
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

  it('renders no header or cells for a hidden column, and no skeleton for it while loading', () => {
    render(<DataTable {...baseProps({ columnVisibility: { status: false }, isLoading: true })} />);

    expect(screen.queryByText('Status')).not.toBeInTheDocument();

    const table = screen.getByRole('table');

    expect(table.querySelectorAll('thead th')).toHaveLength(1);
    expect(table.querySelectorAll('tbody tr')[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(1);
  });
});

describe('DataTable bulk actions', () => {
  const selectFirstRow = () => {
    fireEvent.click(
      within(screen.getByText('Alpha').closest('tr') as HTMLElement).getByRole('checkbox'),
    );
  };

  it('applies a lone bulk action from a single button, with no action to choose first', async () => {
    const onBulkApply = vi.fn().mockResolvedValue(undefined);

    render(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          bulkActions: [{ value: 'trash', title: 'Trash', destructive: true }],
          onBulkApply,
          hidePagination: true,
        })}
      />,
    );

    selectFirstRow();

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trash' }));

    await waitFor(() => expect(onBulkApply).toHaveBeenCalledTimes(1));
    expect(onBulkApply).toHaveBeenCalledWith('trash', {
      selectedIds: ['1'],
      isAllMatchingSelected: false,
      selectedCount: 1,
    });
  });

  it('still asks which action to apply when more than one is offered', () => {
    render(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          bulkActions: [
            { value: 'restore', title: 'Restore' },
            { value: 'delete', title: 'Delete' },
          ],
          onBulkApply: noop,
          hidePagination: true,
        })}
      />,
    );

    selectFirstRow();

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('presents no action control when none are offered', () => {
    render(<DataTable {...baseProps({ enableRowSelection: true, hidePagination: true })} />);

    selectFirstRow();

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
  });

  it('retains the selection when the caller fails to handle the action', async () => {
    const onBulkApply = vi.fn().mockRejectedValue(new Error('nope'));

    render(
      <DataTable
        {...baseProps({
          enableRowSelection: true,
          bulkActions: [{ value: 'trash', title: 'Trash', destructive: true }],
          onBulkApply,
          hidePagination: true,
        })}
      />,
    );

    selectFirstRow();
    fireEvent.click(screen.getByRole('button', { name: 'Trash' }));

    await waitFor(() => expect(onBulkApply).toHaveBeenCalledTimes(1));

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trash' })).toBeInTheDocument();
  });
});

describe('DataTable column visibility', () => {
  // Radix opens the menu on pointerdown, which jsdom does not synthesise from a
  // click; its trigger also opens on Enter, which fireEvent can deliver.
  const openColumnsMenu = () => {
    fireEvent.keyDown(screen.getByRole('button', { name: 'Columns' }), { key: 'Enter' });
  };

  // While the menu is open Radix marks the rest of the page aria-hidden, so the
  // header cells have to be read from the DOM rather than by role.
  const renderedHeaders = () =>
    Array.from(document.querySelectorAll('thead th')).map((cell) => cell.textContent?.trim());

  it('offers every column that carries a header, and neither the selection nor a headerless one', () => {
    const withActions: ColumnDef<Item>[] = [
      ...columns,
      { id: 'actions', header: '', cell: () => null },
    ];

    render(
      <DataTable {...baseProps({ columns: withActions, enableRowSelection: true })} />,
    );

    openColumnsMenu();

    const menu = screen.getByRole('menu');
    expect(within(menu).getByText('Name')).toBeInTheDocument();
    expect(within(menu).getByText('Status')).toBeInTheDocument();
    expect(within(menu).queryByText('actions')).not.toBeInTheDocument();
    expect(within(menu).getAllByRole('menuitemcheckbox')).toHaveLength(2);
  });

  it('stays open across several toggles and hides each column as it goes', () => {
    render(<DataTable {...baseProps()} />);

    openColumnsMenu();

    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(renderedHeaders()).toEqual(['Name']);
    expect(screen.getByRole('menuitemcheckbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('refuses to hide the last visible column', () => {
    render(<DataTable {...baseProps()} />);

    openColumnsMenu();
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Name' }));

    expect(renderedHeaders()).toEqual(['Name']);
  });

  it('restores what a previous visit hid', () => {
    window.localStorage.setItem(
      'kirki-ecommerce:table-columns:remembered',
      JSON.stringify({ status: false }),
    );

    render(<DataTable {...baseProps({ tableId: 'remembered' })} />);

    expect(renderedHeaders()).toEqual(['Name']);
  });

  it('presents no control when the caller supplies the hidden set itself', () => {
    render(<DataTable {...baseProps({ columnVisibility: { status: false } })} />);

    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
    expect(renderedHeaders()).toEqual(['Name']);
  });

  it('presents no control when the caller opts out', () => {
    render(<DataTable {...baseProps({ enableColumnVisibility: false })} />);

    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });
});

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import CustomizeHomeSheet from '@/features/home/components/customize-home-sheet';
import { HOME_LAYOUT_STORAGE_KEY, useHomeLayout } from '@/features/home/hooks/use-home-layout';
import { DEFAULT_HOME_LAYOUT, type HomeLayout } from '@/features/home/lib/layout';

const ROW_HEIGHT = 40;

const storedLayout = () =>
  JSON.parse(window.localStorage.getItem(HOME_LAYOUT_STORAGE_KEY) ?? 'null') as HomeLayout;

const Harness = () => {
  const layoutControls = useHomeLayout();

  return <CustomizeHomeSheet layoutControls={layoutControls} />;
};

const openSheet = () => {
  render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <Harness />
      </div>
    </div>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Customize home' }));

  return screen.getByRole('dialog', { name: 'Customize home' });
};

const group = (name: string) => screen.getByRole('list', { name });

const checkbox = (groupName: string, name: string) =>
  within(group(groupName)).getByRole('checkbox', { name });

const rowKeys = (name: string) =>
  within(group(name))
    .getAllByRole('listitem')
    .map((row) => row.getAttribute('data-testid')?.replace('customize-item-', ''));

const rectOf = (top: number, height: number) =>
  ({
    x: 0,
    y: top,
    top,
    left: 0,
    right: 300,
    bottom: top + height,
    width: 300,
    height,
    toJSON: () => ({}),
  }) as DOMRect;

const mockRowRects = () => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect(
    this: Element,
  ) {
    if (this.getAttribute('role') === 'list') {
      return rectOf(0, this.children.length * ROW_HEIGHT);
    }

    const row =
      this.parentElement?.getAttribute('role') === 'list'
        ? this
        : this.closest('[role="listitem"]')?.parentElement;

    if (!row?.parentElement) {
      return rectOf(0, 2000);
    }

    return rectOf(Array.from(row.parentElement.children).indexOf(row) * ROW_HEIGHT, ROW_HEIGHT);
  });
};

const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CustomizeHomeSheet', () => {
  it('shows the three groups with the default layout', () => {
    const dialog = openSheet();

    expect(within(dialog).getByText('Quick actions')).toBeInTheDocument();
    expect(within(dialog).getByText('2/3')).toBeInTheDocument();
    expect(within(dialog).getByText('4/4')).toBeInTheDocument();
    expect(rowKeys('Quick actions')).toEqual(DEFAULT_HOME_LAYOUT.actions.map((item) => item.key));
    expect(
      within(screen.getByTestId('customize-item-create_order')).getByText('Main button'),
    ).toBeInTheDocument();
    expect(checkbox('Key numbers', 'Total sales')).toBeChecked();
    expect(checkbox('Key numbers', 'Gross sales')).not.toBeChecked();
    expect(checkbox('Sections', 'Restock soon')).not.toBeChecked();
    expect(checkbox('Sections', 'Needs your attention')).toBeChecked();
  });

  it('disables the unchecked items of a full group', () => {
    openSheet();

    expect(checkbox('Key numbers', 'Gross sales')).toBeDisabled();
    expect(checkbox('Key numbers', 'Total sales')).toBeEnabled();

    fireEvent.click(checkbox('Quick actions', 'Add product'));

    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(checkbox('Quick actions', 'Create coupon')).toBeDisabled();
    expect(checkbox('Quick actions', 'Add customer')).toBeDisabled();
  });

  it('enables the key numbers again when one is cleared', () => {
    openSheet();

    fireEvent.click(checkbox('Key numbers', 'Net sales'));

    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(checkbox('Key numbers', 'Gross sales')).toBeEnabled();
  });

  it('lets every section be turned off', () => {
    openSheet();

    DEFAULT_HOME_LAYOUT.sections
      .filter((item) => item.visible)
      .forEach((item) => {
        const box = within(screen.getByTestId(`customize-item-${item.key}`)).getByRole('checkbox');

        fireEvent.click(box);
      });

    expect(storedLayout().sections.every((item) => !item.visible)).toBe(true);
    within(group('Sections'))
      .getAllByRole('checkbox')
      .forEach((box) => {
        expect(box).toBeEnabled();
      });
  });

  it('moves the main button with the keyboard', async () => {
    mockRowRects();
    openSheet();

    const handle = screen.getByRole('button', { name: 'Reorder View live site' });

    act(() => handle.focus());
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    await flush();
    fireEvent.keyDown(document, { code: 'ArrowUp', key: 'ArrowUp' });
    await flush();
    fireEvent.keyDown(document, { code: 'Space', key: ' ' });
    await flush();

    expect(rowKeys('Quick actions').slice(0, 2)).toEqual(['view_live_site', 'create_order']);
    expect(
      within(screen.getByTestId('customize-item-view_live_site')).getByText('Main button'),
    ).toBeInTheDocument();
  });

  it('resets to the default layout', () => {
    openSheet();

    fireEvent.click(checkbox('Sections', 'Recent orders'));
    fireEvent.click(checkbox('Quick actions', 'Add product'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));

    expect(storedLayout()).toEqual(DEFAULT_HOME_LAYOUT);
    expect(checkbox('Sections', 'Recent orders')).toBeChecked();
  });

  it('closes on Done', () => {
    openSheet();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

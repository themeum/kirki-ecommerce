import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { endpoints } from '@/config/endpoints';
import BulkEditPage from '@/features/bulk-edit/pages/bulk-edit';
import { server } from '@/tests/msw/server';

const baseUrl = () => window.kirki_ecommerce.rest_url_base;

const buildVariant = (id: number, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Variant ${id}`,
  media: null,
  sku: `SKU-${id}`,
  barcode: null,
  base_price: id * 100,
  base_price_money_object: { raw: id * 100, display: `$${id * 100}`, currency: { code: 'USD', symbol: '$' } },
  display_price: id * 100,
  display_price_money_object: { raw: id * 100, display: `$${id * 100}`, currency: { code: 'USD', symbol: '$' } },
  show_unit_price: false,
  base_unit: null,
  base_unit_amount: null,
  total_unit: null,
  total_unit_amount: null,
  base_sale_price: null,
  base_sale_price_money_object: null,
  display_sale_price: null,
  display_sale_price_money_object: null,
  base_cost_of_goods: null,
  base_cost_of_goods_money_object: null,
  display_cost_of_goods: null,
  display_cost_of_goods_money_object: null,
  weight: null,
  weight_unit: null,
  dimension_unit: null,
  charge_taxes: true,
  allow_back_order: false,
  track_inventory: true,
  available_quantity: 10,
  in_stock: true,
  committed_quantity: 0,
  low_stock_threshold: null,
  has_limit_per_order: false,
  max_per_order: null,
  tax_profile_id: null,
  shipping_profile_id: null,
  shipping_box_id: null,
  is_visible: true,
  is_physical_product: true,
  is_default: true,
  attribute_values: [],
  attribute_value_labels: [],
  created_by: 1,
  updated_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const registerReferenceDataHandlers = () => {
  server.use(
    http.get(`${baseUrl()}${endpoints.TAX_PROFILES}`, () =>
      HttpResponse.json({ data: { results: [], total: 0, per_page: -1 }, message: 'ok' }),
    ),
    http.get(`${baseUrl()}${endpoints.SHIPPING_PROFILES}`, () =>
      HttpResponse.json({ data: { results: [], total: 0, per_page: -1 }, message: 'ok' }),
    ),
    http.get(`${baseUrl()}${endpoints.SHIPPING_BOXES}`, () =>
      HttpResponse.json({ data: { results: [], total: 0, per_page: -1 }, message: 'ok' }),
    ),
  );
};

const renderBulkEditPage = (variants: ReturnType<typeof buildVariant>[]) => {
  registerReferenceDataHandlers();
  server.use(
    http.get(`${baseUrl()}${endpoints.VARIANTS_BULK_BY_IDS(variants.map((v) => v.id))}`, () =>
      HttpResponse.json({ data: variants, message: 'ok' }),
    ),
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: '/variants/bulk', element: <BulkEditPage /> }], {
    initialEntries: [`/variants/bulk?ids=${variants.map((v) => v.id).join(',')}`],
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { queryClient };
};

const getCell = (field: string, row: number) => document.querySelector<HTMLElement>(`[data-bulk-field="${field}"][data-bulk-row="${row}"]`);

const getCellInput = (field: string, row: number) => getCell(field, row)?.querySelector<HTMLInputElement>('input');

describe('BulkEditPage grid', () => {
  beforeAll(() => {
    // jsdom has no layout engine, so @tanstack/react-virtual's element-size
    // reads (offsetWidth/offsetHeight) are always 0 and it renders zero rows.
    // Stub a realistic viewport size so the virtualizer behaves as it would
    // in a real browser.
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 640 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1200 });
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('shift-click extends a range without changing values', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    expect(getCell('base_price', 0)?.dataset.bulkCell).toBe('selected');
    expect(getCell('base_price', 1)?.dataset.bulkCell).toBe('selected');
    expect(getCell('base_price', 2)?.dataset.bulkCell).toBe('selected');

    expect(getCellInput('base_price', 0)?.value).toBe('100');
    expect(getCellInput('base_price', 1)?.value).toBe('200');
    expect(getCellInput('base_price', 2)?.value).toBe('300');
  });

  it('editing a cell in a range fans the value across it', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    fireEvent.doubleClick(getCell('base_price', 0)!);
    fireEvent.change(getCellInput('base_price', 0)!, { target: { value: '999' } });

    expect(getCellInput('base_price', 0)?.value).toBe('999');
    expect(getCellInput('base_price', 1)?.value).toBe('999');
    expect(getCellInput('base_price', 2)?.value).toBe('999');
  });

  it('fill-handle drag copies the origin value down', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_cost_of_goods', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_cost_of_goods', 0)!);
    fireEvent.doubleClick(getCell('base_cost_of_goods', 0)!);
    fireEvent.change(getCellInput('base_cost_of_goods', 0)!, { target: { value: '55' } });
    fireEvent.mouseUp(window);

    const grabber = getCell('base_cost_of_goods', 0)!.querySelector<HTMLElement>('[data-grabber="true"]');
    fireEvent.mouseDown(grabber!);
    fireEvent.mouseEnter(getCell('base_cost_of_goods', 1)!);
    fireEvent.mouseEnter(getCell('base_cost_of_goods', 2)!);
    fireEvent.mouseUp(window);

    expect(getCellInput('base_cost_of_goods', 1)?.value).toBe('55');
    expect(getCellInput('base_cost_of_goods', 2)?.value).toBe('55');
  });

  it('shows the unsaved indicator on first edit and clears it after save', async () => {
    const variants = [buildVariant(1)];
    renderBulkEditPage(variants);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();

    fireEvent.doubleClick(getCell('base_price', 0)!);
    fireEvent.change(getCellInput('base_price', 0)!, { target: { value: '150' } });

    await waitFor(() => expect(screen.getByText('Unsaved Changes')).toBeInTheDocument());

    server.use(
      http.put(`${baseUrl()}${endpoints.VARIANTS_BULK}`, () =>
        HttpResponse.json({ data: [buildVariant(1, { base_price: 150 })], message: 'Variants updated successfully.' }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument());
  });

  it('cmd/ctrl-click selects non-adjacent rows without selecting the rows between them', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { metaKey: true });
    fireEvent.mouseUp(window);

    expect(getCell('base_price', 0)?.dataset.bulkCell).toBe('selected');
    expect(getCell('base_price', 1)?.dataset.bulkCell).toBeUndefined();
    expect(getCell('base_price', 2)?.dataset.bulkCell).toBe('selected');
  });

  it('editing a cell within a cmd/ctrl-click selection fans the value out to every selected row', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { metaKey: true });
    fireEvent.mouseUp(window);

    fireEvent.doubleClick(getCell('base_price', 2)!);
    fireEvent.change(getCellInput('base_price', 2)!, { target: { value: '777' } });

    expect(getCellInput('base_price', 0)?.value).toBe('777');
    expect(getCellInput('base_price', 1)?.value).toBe('200');
    expect(getCellInput('base_price', 2)?.value).toBe('777');
  });

  it('clicking a cell already inside the selection collapses to just that cell', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    fireEvent.mouseDown(getCell('base_price', 1)!);
    fireEvent.mouseUp(window);

    expect(getCell('base_price', 0)?.dataset.bulkCell).toBeUndefined();
    expect(getCell('base_price', 1)?.dataset.bulkCell).toBe('selected');
    expect(getCell('base_price', 2)?.dataset.bulkCell).toBeUndefined();
  });

  it('shows the product title with attribute value labels', async () => {
    renderBulkEditPage([
      buildVariant(1, { name: 'Sample Product', attribute_value_labels: ['Red', 'XL'] }),
      buildVariant(2, { name: 'Simple Product' }),
    ]);

    await waitFor(() => expect(screen.getByText('Sample Product - Red | XL')).toBeInTheDocument());
    expect(screen.getByText('Simple Product')).toBeInTheDocument();
  });

  it('typing on a selected cell replaces its value', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);

    fireEvent.keyDown(document, { key: '5' });

    expect(getCellInput('base_price', 0)?.value).toBe('5');
  });

  it('typing while a non-contiguous selection is active fans out to every selected row', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 2)!, { metaKey: true });
    fireEvent.mouseUp(window);

    fireEvent.keyDown(document, { key: '5' });

    expect(getCellInput('base_price', 0)?.value).toBe('5');
    expect(getCellInput('base_price', 1)?.value).toBe('200');
    expect(getCellInput('base_price', 2)?.value).toBe('5');
  });

  it('Enter activates a selected cell without clearing its value', async () => {
    renderBulkEditPage([buildVariant(1)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);

    fireEvent.keyDown(getCell('base_price', 0)!, { key: 'Enter' });

    expect(getCellInput('base_price', 0)?.value).toBe('100');
  });

  it('clicking the checkbox glyph toggles it and selects the cell', async () => {
    renderBulkEditPage([buildVariant(1, { track_inventory: true }), buildVariant(2, { track_inventory: true })]);

    await waitFor(() => expect(getCell('track_inventory', 0)).toBeTruthy());

    const checkbox = getCell('track_inventory', 0)!.querySelector<HTMLButtonElement>('button')!;

    fireEvent.mouseDown(checkbox);
    fireEvent.click(checkbox);
    fireEvent.mouseUp(window);

    expect(checkbox.dataset.state).toBe('unchecked');
    expect(getCell('track_inventory', 0)?.dataset.bulkCell).toBe('selected');
  });

  it('clicking elsewhere in a checkbox cell only selects, without toggling', async () => {
    renderBulkEditPage([buildVariant(1, { track_inventory: true })]);

    await waitFor(() => expect(getCell('track_inventory', 0)).toBeTruthy());

    const checkbox = getCell('track_inventory', 0)!.querySelector<HTMLButtonElement>('button')!;

    fireEvent.mouseDown(getCell('track_inventory', 0)!);
    fireEvent.mouseUp(window);

    expect(checkbox.dataset.state).toBe('checked');
    expect(getCell('track_inventory', 0)?.dataset.bulkCell).toBe('selected');
  });

  it('Space toggles every selected checkbox cell in a multi-row selection', async () => {
    renderBulkEditPage([
      buildVariant(1, { track_inventory: true }),
      buildVariant(2, { track_inventory: true }),
      buildVariant(3, { track_inventory: true }),
    ]);

    await waitFor(() => expect(getCell('track_inventory', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('track_inventory', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('track_inventory', 2)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    fireEvent.keyDown(document, { key: ' ' });

    expect(getCell('track_inventory', 0)!.querySelector<HTMLButtonElement>('button')!.dataset.state).toBe('unchecked');
    expect(getCell('track_inventory', 1)!.querySelector<HTMLButtonElement>('button')!.dataset.state).toBe('unchecked');
    expect(getCell('track_inventory', 2)!.querySelector<HTMLButtonElement>('button')!.dataset.state).toBe('unchecked');
  });

  it('clicking a cell outside the selection replaces it', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('base_price', 1)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    fireEvent.mouseDown(getCell('base_price', 2)!);
    fireEvent.mouseUp(window);

    expect(getCell('base_price', 0)?.dataset.bulkCell).toBeUndefined();
    expect(getCell('base_price', 1)?.dataset.bulkCell).toBeUndefined();
    expect(getCell('base_price', 2)?.dataset.bulkCell).toBe('selected');
  });
});

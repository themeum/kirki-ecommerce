import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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

/**
 * Captures the body of the next bulk-save request, so an edit's effect on a
 * field with no directly observable control (a row's `in_stock`, which sits
 * behind a Radix trigger) can be asserted through what is actually submitted.
 */
const captureSavePayload = () => {
  const captured: { body?: { variants: Record<string, unknown>[] } } = {};

  server.use(
    http.put(`${baseUrl()}${endpoints.VARIANTS_BULK}`, async ({ request }) => {
      captured.body = (await request.json()) as { variants: Record<string, unknown>[] };
      return HttpResponse.json({ data: [], message: 'ok' });
    }),
  );

  return captured;
};

const savedVariant = (
  captured: { body?: { variants: Record<string, unknown>[] } },
  id: number,
) => captured.body?.variants.find((variant) => variant.id === id);

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

  it('the SKU header Generate button appears only while SKU cells are selected', async () => {
    renderBulkEditPage([buildVariant(1), buildVariant(2)]);

    await waitFor(() => expect(getCellInput('sku', 0)).toBeTruthy());

    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();

    fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);

    expect(screen.queryByRole('button', { name: 'Generate' })).not.toBeInTheDocument();

    fireEvent.mouseDown(getCell('sku', 0)!);
    fireEvent.mouseUp(window);

    expect(screen.getByRole('button', { name: 'Generate' })).toBeInTheDocument();
  });

  it('the Generate button requests one SKU per selected row and writes each one back', async () => {
    const requested: number[][] = [];
    server.use(
      http.post(`${baseUrl()}${endpoints.VARIANTS_GENERATE_SKUS}`, async ({ request }) => {
        const body = (await request.json()) as { variant_ids: number[] };
        requested.push(body.variant_ids);
        return HttpResponse.json({
          data: body.variant_ids.map((variantId, index) => ({
            variant_id: variantId,
            sku: `GEN-00${index + 1}`,
          })),
          message: 'ok',
        });
      }),
    );

    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('sku', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('sku', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('sku', 1)!, { shiftKey: true });
    fireEvent.mouseUp(window);

    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => expect(getCellInput('sku', 0)?.value).toBe('GEN-001'));

    expect(requested).toEqual([[1, 2]]);
    expect(getCellInput('sku', 1)?.value).toBe('GEN-002');
    expect(getCellInput('sku', 2)?.value).toBe('SKU-3');
  });

  it('dragging the SKU fill handle generates a SKU for every row in the range, origin included', async () => {
    server.use(
      http.post(`${baseUrl()}${endpoints.VARIANTS_GENERATE_SKUS}`, async ({ request }) => {
        const body = (await request.json()) as { variant_ids: number[] };
        return HttpResponse.json({
          data: body.variant_ids.map((variantId, index) => ({
            variant_id: variantId,
            sku: `GEN-00${index + 1}`,
          })),
          message: 'ok',
        });
      }),
    );

    renderBulkEditPage([buildVariant(1), buildVariant(2), buildVariant(3)]);

    await waitFor(() => expect(getCellInput('sku', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('sku', 0)!);
    fireEvent.mouseUp(window);

    const grabber = getCell('sku', 0)!.querySelector<HTMLElement>('[data-grabber="true"]');
    fireEvent.mouseDown(grabber!);
    fireEvent.mouseEnter(getCell('sku', 1)!);
    fireEvent.mouseEnter(getCell('sku', 2)!);
    fireEvent.mouseUp(window);

    await waitFor(() => expect(getCellInput('sku', 0)?.value).toBe('GEN-001'));

    expect(getCellInput('sku', 1)?.value).toBe('GEN-002');
    expect(getCellInput('sku', 2)?.value).toBe('GEN-003');
  });

  it('leaves the caret after a keystroke-seeded value instead of selecting it', async () => {
    renderBulkEditPage([buildVariant(1)]);

    await waitFor(() => expect(getCellInput('sku', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('sku', 0)!);
    fireEvent.mouseUp(window);

    fireEvent.keyDown(document, { key: 'a' });

    const input = getCellInput('sku', 0)!;

    expect(input.value).toBe('a');
    expect(document.activeElement).toBe(input);
    // A collapsed selection at the end is what makes the next keystroke append
    // rather than replace. jsdom cannot deliver that next keystroke into the
    // input, so the caret position is the observable contract here.
    expect(input.selectionStart).toBe(1);
    expect(input.selectionEnd).toBe(1);
  });

  it('still selects the existing value when Enter activates the cell', async () => {
    renderBulkEditPage([buildVariant(1)]);

    await waitFor(() => expect(getCellInput('sku', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('sku', 0)!);
    fireEvent.mouseUp(window);

    fireEvent.keyDown(getCell('sku', 0)!, { key: 'Enter' });

    const input = getCellInput('sku', 0)!;

    expect(input.value).toBe('SKU-1');
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('SKU-1'.length);
  });

  it('does not select a keystroke-seeded value in a numeric cell either', async () => {
    // Weight is `<input type="number">`, whose selection API jsdom (like the
    // spec) does not expose — so the contract is asserted through select()
    // itself, which is what the shared Input calls on focus.
    const select = vi.spyOn(HTMLInputElement.prototype, 'select');

    renderBulkEditPage([buildVariant(1)]);

    await waitFor(() => expect(getCellInput('weight', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('weight', 0)!);
    fireEvent.mouseUp(window);
    select.mockClear();

    fireEvent.keyDown(document, { key: '1' });

    expect(getCellInput('weight', 0)?.value).toBe('1');
    expect(select).not.toHaveBeenCalled();

    select.mockRestore();
  });

  it('selects a numeric cell value when Enter activates it', async () => {
    const select = vi.spyOn(HTMLInputElement.prototype, 'select');

    renderBulkEditPage([buildVariant(1, { weight: 250 })]);

    await waitFor(() => expect(getCellInput('weight', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('weight', 0)!);
    fireEvent.mouseUp(window);
    select.mockClear();

    fireEvent.keyDown(getCell('weight', 0)!, { key: 'Enter' });

    expect(select).toHaveBeenCalled();

    select.mockRestore();
  });

  it('suppresses the default focus shift only on the press that activates a cell', async () => {
    // The browser's default mousedown action (focusing the <td>) is what used
    // to dismiss a just-opened non-modal popover. jsdom does not implement that
    // default action, so what is asserted here is the contract that prevents
    // it: fireEvent returns false when preventDefault was called.
    renderBulkEditPage([buildVariant(1)]);

    await waitFor(() => expect(getCellInput('base_price', 0)).toBeTruthy());

    const selectingPress = fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    expect(selectingPress).toBe(true);

    const activatingPress = fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    expect(activatingPress).toBe(false);

    const pressOnActiveCell = fireEvent.mouseDown(getCell('base_price', 0)!);
    fireEvent.mouseUp(window);
    expect(pressOnActiveCell).toBe(true);
  });

  it('shows a stock-status control instead of a quantity on an untracked row', async () => {
    renderBulkEditPage([
      buildVariant(1, { track_inventory: true, available_quantity: 10 }),
      buildVariant(2, { track_inventory: false, in_stock: true }),
    ]);

    await waitFor(() => expect(getCellInput('available_quantity', 0)).toBeTruthy());

    const untracked = getCell('available_quantity', 1)!;

    expect(untracked.querySelector('input')).toBeNull();
    expect(untracked.querySelector('[data-slot="select-trigger"]')).toBeTruthy();
    // A dropdown has no typed value to seed, so type-to-edit must skip it.
    expect(untracked.dataset.bulkEditableKind).toBe('other');
    expect(getCell('available_quantity', 0)?.dataset.bulkEditableKind).toBe('number');
  });

  it('filling Availability from a tracked row skips untracked rows', async () => {
    renderBulkEditPage([
      buildVariant(1, { track_inventory: true, available_quantity: 99 }),
      buildVariant(2, { track_inventory: false, in_stock: true }),
      buildVariant(3, { track_inventory: true, available_quantity: 5 }),
    ]);

    await waitFor(() => expect(getCellInput('available_quantity', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('available_quantity', 0)!);
    fireEvent.mouseUp(window);

    const grabber = getCell('available_quantity', 0)!.querySelector<HTMLElement>('[data-grabber="true"]');
    fireEvent.mouseDown(grabber!);
    fireEvent.mouseEnter(getCell('available_quantity', 1)!);
    fireEvent.mouseEnter(getCell('available_quantity', 2)!);
    fireEvent.mouseUp(window);

    await waitFor(() => expect(getCellInput('available_quantity', 2)?.value).toBe('99'));

    // The untracked row kept its dropdown and was never given a quantity.
    expect(getCell('available_quantity', 1)?.querySelector('input')).toBeNull();

    const captured = captureSavePayload();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(captured.body).toBeTruthy());

    expect(savedVariant(captured, 1)?.available_quantity).toBe(99);
    expect(savedVariant(captured, 3)?.available_quantity).toBe(99);
    // The untracked row in the middle of the range kept its own quantity and
    // its stock status, and its inventory tracking was not switched on.
    expect(savedVariant(captured, 2)?.available_quantity).toBe(10);
    expect(savedVariant(captured, 2)?.in_stock).toBe(true);
    expect(savedVariant(captured, 2)?.track_inventory).toBe(false);
  });

  it('filling Availability from an untracked row skips tracked rows', async () => {
    renderBulkEditPage([
      buildVariant(1, { track_inventory: false, in_stock: false }),
      buildVariant(2, { track_inventory: true, available_quantity: 5 }),
      buildVariant(3, { track_inventory: false, in_stock: true }),
    ]);

    await waitFor(() => expect(getCell('available_quantity', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('available_quantity', 0)!);
    fireEvent.mouseUp(window);

    const grabber = getCell('available_quantity', 0)!.querySelector<HTMLElement>('[data-grabber="true"]');
    fireEvent.mouseDown(grabber!);
    fireEvent.mouseEnter(getCell('available_quantity', 1)!);
    fireEvent.mouseEnter(getCell('available_quantity', 2)!);
    fireEvent.mouseUp(window);

    await waitFor(() => expect(screen.getByText('Unsaved Changes')).toBeInTheDocument());

    // The tracked row in the middle of the range kept its quantity field and
    // its value, rather than being handed a stock status it cannot show.
    expect(getCellInput('available_quantity', 1)?.value).toBe('5');

    const captured = captureSavePayload();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(captured.body).toBeTruthy());

    // Only the other untracked row took the source's stock status; the tracked
    // row was not switched to untracked either.
    expect(savedVariant(captured, 3)?.in_stock).toBe(false);
    expect(savedVariant(captured, 2)?.available_quantity).toBe(5);
    expect(savedVariant(captured, 2)?.in_stock).toBe(true);
    expect(savedVariant(captured, 2)?.track_inventory).toBe(true);
  });

  it('typing an Availability quantity fans out only to other tracked rows', async () => {
    renderBulkEditPage([
      buildVariant(1, { track_inventory: true, available_quantity: 10 }),
      buildVariant(2, { track_inventory: false, in_stock: true }),
      buildVariant(3, { track_inventory: true, available_quantity: 20 }),
    ]);

    await waitFor(() => expect(getCellInput('available_quantity', 0)).toBeTruthy());

    fireEvent.mouseDown(getCell('available_quantity', 0)!);
    fireEvent.mouseUp(window);
    fireEvent.mouseDown(getCell('available_quantity', 2)!, { metaKey: true });
    fireEvent.mouseUp(window);

    fireEvent.keyDown(document, { key: '7' });

    expect(getCellInput('available_quantity', 0)?.value).toBe('7');
    expect(getCellInput('available_quantity', 2)?.value).toBe('7');
    expect(getCell('available_quantity', 1)?.querySelector('input')).toBeNull();
  });

  it('unchecking Track Inventory leaves the row quantity untouched', async () => {
    renderBulkEditPage([buildVariant(1, { track_inventory: true, available_quantity: 250 })]);

    await waitFor(() => expect(getCellInput('available_quantity', 0)?.value).toBe('250'));

    const checkbox = getCell('track_inventory', 0)!.querySelector<HTMLElement>('[role="checkbox"]');
    fireEvent.click(checkbox!);

    await waitFor(() => expect(getCell('available_quantity', 0)?.querySelector('input')).toBeNull());

    fireEvent.click(checkbox!);

    await waitFor(() => expect(getCellInput('available_quantity', 0)?.value).toBe('250'));
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

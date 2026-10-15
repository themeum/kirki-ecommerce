import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import AttributeList from '@/features/products/components/product-form/sections/variants/attribute-list/attribute-list';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';
import { getDefaultVariantValues, type ProductFormVariantInput } from '@/features/products/schemas/forms/product-form';
import { FormHarness, ValueProbe } from '@/tests/form-field-harness';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

const STORE: Attribute[] = [
  { id: 1, name: 'Color', type: 'color', values: [{ id: 11, value: 'Blue', color: '#0000ff' }] },
  {
    id: 2,
    name: 'Size',
    type: 'list',
    values: [
      { id: 21, value: 'S' },
      { id: 22, value: 'M' },
    ],
  },
  { id: 3, name: 'Material', type: 'list', values: [] },
  { id: 4, name: 'Style', type: 'list', values: [] },
];

const SIZE_APPLIED: Attribute = { id: 2, name: 'Size', values: STORE[1].values };

const variant = (overrides: Partial<ProductFormVariantInput>): ProductFormVariantInput => ({
  ...getDefaultVariantValues(),
  is_default: false,
  ...overrides,
});

const serveStore = () => {
  server.use(
    http.get(`${API}/attributes`, () =>
      HttpResponse.json({ data: { results: STORE, total: STORE.length, per_page: -1 } }),
    ),
  );
};

const renderList = ({
  attributes = [] as Attribute[],
  variants = [] as ProductFormVariantInput[],
} = {}) => {
  serveStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <FormHarness defaultValues={{ attributes, variants, has_variants: attributes.length > 0 }}>
        <AttributeList />
        <ValueProbe name="attributes" />
        <ValueProbe name="variants" />
      </FormHarness>
    </QueryClientProvider>,
  );
};

const probe = <T,>(name: string) => JSON.parse(screen.getByTestId(`probe-${name}`).textContent ?? 'null') as T;

const nameInput = () => screen.getByRole('textbox', { name: 'Variation name' });

const valueInput = () => screen.getByRole('combobox');

const pickValue = (title: string) => {
  fireEvent.click(valueInput().parentElement!);
  fireEvent.click(screen.getByRole('option', { name: new RegExp(`^${title}$`) }));
};

afterEach(cleanup);

describe('AttributeList', () => {
  it('shows the first three attributes by id as presets, then + Add', async () => {
    renderList();

    expect(await screen.findByRole('button', { name: 'Add Color variation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Size variation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Material variation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Style variation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('opens a draft card from a preset and hands its slot to the next attribute', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));

    expect(nameInput()).toHaveValue('Size');
    expect(screen.queryByRole('button', { name: 'Add Size variation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Style variation' })).toBeDisabled();
  });

  it('focuses the value field when a preset opens the card', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Color variation' }));

    expect(valueInput()).toHaveFocus();
  });

  it('focuses the name field when a brand-new card opens', async () => {
    renderList();
    await screen.findByRole('button', { name: 'Add Color variation' });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add new' }));

    expect(nameInput()).toHaveFocus();
  });

  it('drops the draft on Cancel and returns the preset', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: 'Variation name' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Size variation' })).toBeEnabled();
  });

  it('creates a new attribute in one request on Apply and regenerates the grid', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${API}/attributes`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(
          { data: { id: 50, name: 'Fabric', type: 'list', values: [{ id: 500, value: 'Cotton' }] } },
          { status: 201 },
        );
      }),
    );

    renderList();
    await screen.findByRole('button', { name: 'Add Color variation' });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add new' }));
    fireEvent.change(nameInput(), { target: { value: 'Fabric' } });
    fireEvent.click(valueInput().parentElement!);
    fireEvent.change(valueInput(), { target: { value: 'Cotton' } });
    fireEvent.keyDown(valueInput(), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(probe<Attribute[]>('attributes')).toHaveLength(1));

    expect(bodies).toEqual([{ name: 'Fabric', type: 'list', values: [{ value: 'Cotton', color: null }] }]);
    expect(probe<Attribute[]>('attributes')[0]).toMatchObject({ id: 50, values: [{ id: 500 }] });
    expect(probe<ProductFormVariantInput[]>('variants').map((item) => item.attribute_values)).toEqual([[500]]);
  });

  it('replaces a renamed attribute with a copy and keeps saved variants', async () => {
    server.use(
      http.post(`${API}/attributes`, () =>
        HttpResponse.json(
          {
            data: {
              id: 60,
              name: 'Fit Size',
              type: 'list',
              values: [
                { id: 601, value: 'S' },
                { id: 602, value: 'M' },
              ],
            },
          },
          { status: 201 },
        ),
      ),
    );

    renderList({
      attributes: [SIZE_APPLIED],
      variants: [
        variant({ id: 1, attribute_values: [21], sku: 'SKU-S' }),
        variant({ id: 2, attribute_values: [22], sku: 'SKU-M' }),
      ],
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Size' }));
    fireEvent.change(nameInput(), { target: { value: 'Fit Size' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(probe<Attribute[]>('attributes')[0].id).toBe(60));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      probe<ProductFormVariantInput[]>('variants').map(({ id, sku, attribute_values }) => ({ id, sku, attribute_values })),
    ).toEqual([
      { id: 1, sku: 'SKU-S', attribute_values: [601] },
      { id: 2, sku: 'SKU-M', attribute_values: [602] },
    ]);
  });

  it('flags a duplicate name on blur while values are selected and blocks Apply', async () => {
    let requests = 0;
    server.use(
      http.post(`${API}/attributes`, () => {
        requests += 1;
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );

    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));
    pickValue('S');
    fireEvent.change(nameInput(), { target: { value: ' material ' } });
    fireEvent.blur(nameInput());

    expect(await screen.findByText('An attribute with this name already exists.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(screen.getByText('An attribute with this name already exists.')).toBeInTheDocument());

    expect(requests).toBe(0);
    expect(probe<Attribute[]>('attributes')).toEqual([]);
  });

  it('loads the matching attribute when a new card is named after it and no value is selected', async () => {
    renderList();
    await screen.findByRole('button', { name: 'Add Color variation' });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add new' }));
    fireEvent.change(nameInput(), { target: { value: 'size' } });
    fireEvent.blur(nameInput());

    await waitFor(() => expect(nameInput()).toHaveValue('Size'));
    expect(screen.queryByText('An attribute with this name already exists.')).not.toBeInTheDocument();

    fireEvent.click(valueInput().parentElement!);

    expect(await screen.findByRole('option', { name: /^S$/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^M$/ })).toBeInTheDocument();
  });

  it('loads the matching attribute when a preset card is renamed with no value selected', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));
    fireEvent.change(nameInput(), { target: { value: 'Color' } });
    fireEvent.blur(nameInput());

    await waitFor(() => expect(nameInput()).toHaveValue('Color'));
    fireEvent.click(valueInput().parentElement!);

    expect(await screen.findByRole('option', { name: /Blue/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^S$/ })).not.toBeInTheDocument();
  });

  it('replaces an applied attribute with the matching one without creating anything', async () => {
    const writes: string[] = [];
    server.use(
      http.post(`${API}/*`, ({ request }) => {
        writes.push(request.url);
        return HttpResponse.json({ data: {} }, { status: 201 });
      }),
    );

    renderList({ attributes: [{ id: 2, name: 'Size', values: [] }] });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Size' }));
    fireEvent.change(nameInput(), { target: { value: 'Color' } });
    fireEvent.blur(nameInput());
    await waitFor(() => expect(nameInput()).toHaveValue('Color'));

    pickValue('Blue');
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(probe<Attribute[]>('attributes')[0].id).toBe(1));

    expect(probe<Attribute[]>('attributes')[0]).toMatchObject({ name: 'Color', values: [{ id: 11 }] });
    expect(writes).toEqual([]);
  });

  it('refuses a name that is already applied to the product in another card', async () => {
    renderList({ attributes: [SIZE_APPLIED] });
    await screen.findByRole('button', { name: 'Edit Size' });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.change(nameInput(), { target: { value: 'size' } });
    fireEvent.blur(nameInput());

    expect(await screen.findByText('This attribute is already added to this product.')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('size');
  });

  it('copies the selected values into a uniquely named attribute and leaves the original alone', async () => {
    const posts: { url: string; body: unknown }[] = [];
    server.use(
      http.post(`${API}/*`, async ({ request }) => {
        posts.push({ url: new URL(request.url).pathname, body: await request.json() });
        return HttpResponse.json(
          { data: { id: 70, name: 'Fit Size', type: 'list', values: [{ id: 701, value: 'S' }] } },
          { status: 201 },
        );
      }),
    );

    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));
    pickValue('S');
    fireEvent.change(nameInput(), { target: { value: 'Fit Size' } });
    fireEvent.blur(nameInput());
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(probe<Attribute[]>('attributes')[0]?.id).toBe(70));

    expect(posts).toEqual([
      { url: '/wp-json/kirki/ecommerce/v1/attributes', body: { name: 'Fit Size', type: 'list', values: [{ value: 'S', color: null }] } },
    ]);
  });

  it('keeps the previous options after a rename to a unique name with no value selected', async () => {
    renderList();
    fireEvent.click(await screen.findByRole('button', { name: 'Add Size variation' }));
    fireEvent.change(nameInput(), { target: { value: 'Fabric' } });
    fireEvent.blur(nameInput());
    fireEvent.click(valueInput().parentElement!);

    expect(await screen.findByRole('option', { name: /^S$/ })).toBeInTheDocument();
    expect(screen.queryByText('An attribute with this name already exists.')).not.toBeInTheDocument();
  });

  it('opens edit mode from the Edit button only', async () => {
    renderList({ attributes: [SIZE_APPLIED] });

    fireEvent.click(await screen.findByText('Size'));
    expect(screen.queryByRole('textbox', { name: 'Variation name' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Size' }));
    expect(nameInput()).toHaveValue('Size');
  });

  it('keeps every other editor entry point inert while one card is open', async () => {
    renderList({ attributes: [SIZE_APPLIED, { id: 3, name: 'Material', values: [] }] });

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Size' }));

    expect(screen.getByRole('button', { name: 'Edit Material' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Material' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Color variation' })).toBeDisabled();
  });
});

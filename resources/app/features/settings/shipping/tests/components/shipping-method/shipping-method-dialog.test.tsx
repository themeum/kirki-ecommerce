import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppConfigProvider } from '@/contexts/app-config-context';
import ShippingMethodDialog from '@/features/settings/shipping/components/shipping-method/shipping-method-dialog';
import type { ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';
import { APP_CONFIG_ENDPOINT, appConfigResponse } from '@/tests/msw/handlers/app-config';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

const storedMethod = (): ShippingMethodData => ({
  id: 'method-1',
  zoneId: 'zone-1',
  type: 'flat_rate',
  name: 'Standard Delivery',
  description: '3-5 business days',
  base_amount: 12,
  is_taxable: true,
  is_enabled: false,
  shipping_rules: [
    {
      relation: 'AND',
      conditions: [{ type: 'cart_weight', operator: '>', value: '5' }],
      action: { type: 'set_shipping_cost', value: '20' },
    },
  ],
});

const zones = (): ShippingZone[] => [
  {
    id: 'zone-1',
    title: 'Domestic',
    is_enabled: true,
    regions: [{ country: 'US', states: [] }],
    shipping_methods: [storedMethod()],
  },
  {
    id: 'zone-2',
    title: 'Europe',
    is_enabled: true,
    regions: [{ country: 'DE', states: [] }],
    shipping_methods: [],
  },
];

let savedZones: ShippingZone[][];

const renderDialog = (method: ShippingMethodData | null, zoneId = 'zone-1') => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  server.use(
    http.put(`${API}/settings`, async ({ request }) => {
      const body = (await request.json()) as { data: { shipping_zones: ShippingZone[] } };
      savedZones.push(body.data.shipping_zones);

      return HttpResponse.json({ success: true, message: 'Saved', data: body.data });
    }),
    http.get(`${API}/*`, ({ request }) =>
      HttpResponse.json(
        request.url === APP_CONFIG_ENDPOINT
          ? { data: appConfigResponse }
          : { success: true, message: '', data: request.url.includes('/settings') ? {} : [] },
      ),
    ),
  );

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AppConfigProvider>
        <ShippingMethodDialog
          zoneId={zoneId}
          method={method}
          shippingZones={zones()}
          onClose={onClose}
          onSaved={onSaved}
        />
      </AppConfigProvider>
    </QueryClientProvider>,
  );

  return { onClose, onSaved };
};

const lastSavedZones = () => savedZones[savedZones.length - 1];

beforeEach(() => {
  savedZones = [];
});

afterEach(cleanup);

describe('ShippingMethodDialog', () => {
  it('fills the form from the listed method without a loading state', () => {
    renderDialog(storedMethod());

    expect(screen.getByText('Edit Shipping Method')).toBeInTheDocument();
    expect(screen.getByLabelText('Method Name')).toHaveValue('Standard Delivery');
    expect(screen.getByLabelText('Description')).toHaveValue('3-5 business days');
    expect(screen.getByText('Shipping Rules')).toBeInTheDocument();
  });

  it('shows the rules card for a method that is not saved yet', () => {
    renderDialog(null);

    expect(screen.getByText('Add Shipping Method')).toBeInTheDocument();
    expect(screen.getByLabelText('Method Name')).toHaveValue('');
    expect(screen.getByText('Shipping Rules')).toBeInTheDocument();
  });

  it('appends a new method to the zone the dialog was opened for', async () => {
    const { onClose, onSaved } = renderDialog(null, 'zone-2');

    fireEvent.change(screen.getByLabelText('Method Name'), { target: { value: 'Express' } });
    fireEvent.change(screen.getByLabelText('Rate'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));

    const [domestic, europe] = lastSavedZones();
    expect(domestic.shipping_methods).toHaveLength(1);
    expect(europe.shipping_methods).toHaveLength(1);
    expect(europe.shipping_methods[0]).toMatchObject({
      name: 'Express',
      type: 'flat_rate',
      base_amount: 25,
      zoneId: 'zone-2',
      is_enabled: false,
      shipping_rules: [],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSaved).toHaveBeenCalledWith(lastSavedZones());
  });

  it('keeps the enabled state and the rules of an edited method', async () => {
    renderDialog(storedMethod());

    fireEvent.change(screen.getByLabelText('Method Name'), { target: { value: 'Economy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));

    const [domestic] = lastSavedZones();
    expect(domestic.shipping_methods).toHaveLength(1);
    expect(domestic.shipping_methods[0]).toMatchObject({
      id: 'method-1',
      name: 'Economy',
      is_enabled: false,
      shipping_rules: storedMethod().shipping_rules,
    });
  });

  it('stores a rule change only when the method is saved', async () => {
    renderDialog(storedMethod());

    const [, editRuleButton] = screen.getAllByRole('button', { name: '' });
    fireEvent.click(editRuleButton);
    fireEvent.change(screen.getByPlaceholderText('e.g., 5'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update rule' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Update rule' })).not.toBeInTheDocument(),
    );
    expect(savedZones).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedZones()[0].shipping_methods[0].shipping_rules?.[0].conditions[0].value).toBe(
      '9',
    );
  });

  it('enables the save after a rule is deleted', async () => {
    renderDialog(storedMethod());

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    const [deleteRuleButton] = screen.getAllByRole('button', { name: '' });
    fireEvent.click(deleteRuleButton);

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedZones()[0].shipping_methods[0].shipping_rules).toEqual([]);
  });

  it('blocks the save and keeps the dialog open when the name is empty', async () => {
    const { onClose } = renderDialog(null);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Method name is required')).toBeInTheDocument();
    expect(savedZones).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sends nothing on cancel', () => {
    const { onClose } = renderDialog(storedMethod());

    fireEvent.change(screen.getByLabelText('Method Name'), { target: { value: 'Economy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(savedZones).toHaveLength(0);
  });
});

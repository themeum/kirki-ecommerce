import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '@/config/endpoints';
import AddTrackingDialog from '@/features/orders/components/order-details/add-tracking-dialog';
import type { OrderShippingCarrier, OrderTracking } from '@/features/orders/schemas/catalog/order';
import { server } from '@/tests/msw/server';

const ORDER_ID = 42;

const UPS_TEMPLATE = 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}';

const carriers: OrderShippingCarrier[] = [
  { id: 'ups', name: 'UPS', tracking_url: UPS_TEMPLATE, logo_url: 'https://example.test/ups.svg' },
  {
    id: 'dhl',
    name: 'DHL',
    tracking_url: 'https://www.dhl.com/track?id={tracking_number}',
    logo_url: null,
  },
];

const mockCarriers = (list: OrderShippingCarrier[] | 'error') => {
  server.use(
    http.get(
      `${window.kirki_ecommerce.rest_url_base}${endpoints.ORDER_SHIPPING_CARRIERS(ORDER_ID)}`,
      () =>
        list === 'error'
          ? HttpResponse.json({ success: false, message: 'Failed' }, { status: 500 })
          : HttpResponse.json({ success: true, message: 'OK', data: list }),
    ),
  );
};

const renderDialog = async ({
  list = carriers,
  tracking = {},
}: { list?: OrderShippingCarrier[] | 'error'; tracking?: OrderTracking } = {}) => {
  mockCarriers(list);
  const onSubmit = vi.fn();

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AddTrackingDialog
        open
        onOpenChange={vi.fn()}
        orderId={ORDER_ID}
        tracking={tracking}
        onSubmit={onSubmit}
      />
    </QueryClientProvider>,
  );

  await screen.findByText('Tracking number');

  return { onSubmit };
};

const chooseCarrier = (name: string) => {
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name }));
};

const typeInto = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const saveButton = () => screen.getByRole('button', { name: 'Save' });

afterEach(cleanup);

describe('AddTrackingDialog', () => {
  it('shows the Select carrier placeholder', async () => {
    await renderDialog();

    expect(screen.getByRole('combobox')).toHaveTextContent('Select carrier');
  });

  it('shows the carrier logo, or a fallback icon, in the list and the selected value', async () => {
    await renderDialog();

    fireEvent.click(screen.getByRole('combobox'));

    const [upsOption, dhlOption] = screen.getAllByRole('option');

    expect(upsOption.querySelector('img')).toHaveAttribute('src', 'https://example.test/ups.svg');
    expect(dhlOption.querySelector('img')).toBeNull();
    expect(dhlOption.querySelector('svg')).not.toBeNull();

    fireEvent.click(upsOption);

    expect(screen.getByRole('combobox').querySelector('img')).toHaveAttribute(
      'src',
      'https://example.test/ups.svg',
    );
  });

  it('lists the zone carriers followed by Other', async () => {
    await renderDialog();

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'UPS',
      'DHL',
      'Other',
    ]);
  });

  it('has no Tracking URL input for a listed carrier', async () => {
    await renderDialog();

    chooseCarrier('UPS');

    expect(screen.queryByLabelText('Tracking URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Carrier name')).not.toBeInTheDocument();
  });

  it('previews the link with the placeholder replaced once a number is typed', async () => {
    await renderDialog();

    chooseCarrier('UPS');

    expect(screen.getByText(UPS_TEMPLATE)).toBeInTheDocument();

    typeInto('Tracking number', '1Z999AA10123456784');

    expect(
      screen.getByText('https://www.ups.com/track?loc=en_US&tracknum=1Z999AA10123456784'),
    ).toBeInTheDocument();
    expect(screen.queryByText(UPS_TEMPLATE)).not.toBeInTheDocument();

    typeInto('Tracking number', '');

    expect(screen.queryByText(/tracknum=1Z999/)).not.toBeInTheDocument();
  });

  it('keeps Save disabled until a carrier and a number are given', async () => {
    const { onSubmit } = await renderDialog();

    expect(saveButton()).toBeDisabled();

    chooseCarrier('UPS');
    typeInto('Tracking number', '   ');

    await waitFor(() => expect(saveButton()).toBeDisabled());

    typeInto('Tracking number', '1Z999');

    await waitFor(() => expect(saveButton()).toBeEnabled());

    fireEvent.click(saveButton());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ carrier_id: 'ups', tracking_number: '1Z999' });
  });

  it('asks for a name and a template when Other is chosen', async () => {
    const { onSubmit } = await renderDialog();

    chooseCarrier('Other');

    typeInto('Carrier name', 'Local Courier');
    typeInto('Tracking URL', 'https://track.example.com/');
    typeInto('Tracking number', 'AB12');

    expect(
      await screen.findByText('The URL must contain the {tracking_number} placeholder.'),
    ).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    typeInto('Tracking URL', 'https://track.example.com/?n={tracking_number}');

    await waitFor(() => expect(saveButton()).toBeEnabled());
    expect(screen.getByText('https://track.example.com/?n=AB12')).toBeInTheDocument();

    fireEvent.click(saveButton());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      carrier: 'Local Courier',
      tracking_number: 'AB12',
      tracking_url: 'https://track.example.com/?n={tracking_number}',
    });
  });

  it('offers only Other when the zone has no enabled carrier', async () => {
    await renderDialog({ list: [] });

    expect(screen.getByLabelText('Carrier name')).toBeInTheDocument();
    expect(screen.getByLabelText('Tracking URL')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Other']);
  });

  it('offers only Other when the carriers cannot be loaded', async () => {
    await renderDialog({ list: 'error' });

    expect(screen.getByLabelText('Carrier name')).toBeInTheDocument();
  });

  it('pre-selects the listed carrier whose name matches the stored tracking', async () => {
    await renderDialog({
      tracking: {
        carrier: 'DHL',
        tracking_number: '555',
        tracking_url: 'https://www.dhl.com/track?id=555',
      },
    });

    expect(screen.getByRole('combobox')).toHaveTextContent('DHL');
    expect(screen.getByLabelText('Tracking number')).toHaveValue('555');
    expect(screen.queryByLabelText('Tracking URL')).not.toBeInTheDocument();
  });

  it('falls back to Other with the stored name and a template for an unlisted carrier', async () => {
    await renderDialog({
      tracking: {
        carrier: 'Old Courier',
        tracking_number: 'AB 12',
        tracking_url: 'https://old.example.com/t/AB%2012',
      },
    });

    expect(screen.getByLabelText('Carrier name')).toHaveValue('Old Courier');
    expect(screen.getByLabelText('Tracking URL')).toHaveValue(
      'https://old.example.com/t/{tracking_number}',
    );
    await waitFor(() =>
      expect(within(document.body).getByRole('button', { name: 'Save' })).toBeEnabled(),
    );
  });
});

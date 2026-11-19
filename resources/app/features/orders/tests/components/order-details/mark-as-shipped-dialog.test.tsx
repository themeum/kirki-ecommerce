import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '@/config/endpoints';
import MarkAsShippedDialog from '@/features/orders/components/order-details/mark-as-shipped-dialog';
import { useOrderAction } from '@/features/orders/hooks/use-order-action';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import type {
  LastUsedShippingCarrier,
  OrderShippingCarrier,
  OrderShippingMeta,
} from '@/features/orders/schemas/catalog/order';
import { server } from '@/tests/msw/server';

vi.mock('@/features/orders/hooks/use-order-action', () => ({ useOrderAction: vi.fn() }));
vi.mock('@/features/orders/hooks/use-order-details', () => ({ useOrderDetails: vi.fn() }));

const ORDER_ID = 42;

const carriers: OrderShippingCarrier[] = [
  {
    id: 'ups',
    name: 'UPS',
    tracking_url: 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
    logo_url: null,
  },
];

const renderDialog = ({
  shippingMethodType = 'flat_rate',
  lastUsed = null,
  shippingMeta = null,
}: {
  shippingMethodType?: string;
  lastUsed?: LastUsedShippingCarrier;
  shippingMeta?: OrderShippingMeta | null;
} = {}) => {
  server.use(
    http.get(
      `${window.kirki_ecommerce.rest_url_base}${endpoints.ORDER_SHIPPING_CARRIERS(ORDER_ID)}`,
      () => HttpResponse.json({ success: true, message: 'OK', data: carriers }),
    ),
    http.get(`${window.kirki_ecommerce.rest_url_base}${endpoints.LAST_USED_SHIPPING_CARRIER}`, () =>
      HttpResponse.json({ success: true, message: 'OK', data: lastUsed }),
    ),
  );
  const onMarkAsShipped = vi.fn();

  vi.mocked(useOrderDetails).mockReturnValue({
    order: {
      id: ORDER_ID,
      order_number: '#1001',
      shipping_method_type: shippingMethodType,
      shipping_method_name: 'Store pickup',
      shipping_meta: shippingMeta,
      shipping_tracking: {},
    },
  } as unknown as ReturnType<typeof useOrderDetails>);
  vi.mocked(useOrderAction).mockReturnValue({
    isMarkAsShippedDialogOpen: true,
    setIsMarkAsShippedDialogOpen: vi.fn(),
    isActionPending: false,
    handleMarkAsShipped: onMarkAsShipped,
  } as unknown as ReturnType<typeof useOrderAction>);

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MarkAsShippedDialog />
    </QueryClientProvider>,
  );

  return { onMarkAsShipped };
};

afterEach(cleanup);

describe('MarkAsShippedDialog', () => {
  it('ships without tracking when no tracking details are added', async () => {
    const { onMarkAsShipped } = renderDialog();

    await screen.findByText('Add tracking details');
    fireEvent.click(screen.getByRole('button', { name: 'Mark as shipped' }));

    expect(onMarkAsShipped).toHaveBeenCalledWith({ tracking: null, notify_customer: false });
  });

  it('ships with the tracking details when they are added', async () => {
    const { onMarkAsShipped } = renderDialog({
      lastUsed: { carrier_id: 'ups', carrier: null },
    });

    fireEvent.change(await screen.findByLabelText('Tracking number'), {
      target: { value: '1Z999' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark as shipped' }));

    await waitFor(() =>
      expect(onMarkAsShipped).toHaveBeenCalledWith({
        tracking: { carrier_id: 'ups', tracking_number: '1Z999' },
        notify_customer: false,
      }),
    );
  });

  it('shows no tracking fields for a local pickup order', () => {
    const { onMarkAsShipped } = renderDialog({ shippingMethodType: 'local_pickup' });

    expect(screen.getByText('Mark #1001 as ready for pickup?')).toBeInTheDocument();
    expect(screen.getByText('Store pickup')).toBeInTheDocument();
    expect(screen.queryByText('Add tracking details')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tracking number')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ready for pickup' }));

    expect(onMarkAsShipped).toHaveBeenCalledWith({ tracking: null, notify_customer: false });
  });

  it('shows the pickup address, hours, and instructions for a local pickup order', () => {
    renderDialog({
      shippingMethodType: 'local_pickup',
      shippingMeta: {
        description: 'Bring your order number.',
        is_taxable: false,
        address: '221 Market St, San Francisco',
        pickup_time_start: '10:00',
        pickup_time_end: '18:00',
      },
    });

    expect(screen.getByText('Pickup at 221 Market St, San Francisco')).toBeInTheDocument();
    expect(screen.getByText('10:00 – 18:00')).toBeInTheDocument();
    expect(screen.getByText('Bring your order number.')).toBeInTheDocument();
    expect(screen.queryByText('Store pickup')).not.toBeInTheDocument();
  });

  it('shows only the method name when the pickup order has no stored details', () => {
    renderDialog({
      shippingMethodType: 'local_pickup',
      shippingMeta: {
        description: null,
        is_taxable: null,
        address: null,
        pickup_time_start: null,
        pickup_time_end: null,
      },
    });

    expect(screen.getByText('Store pickup')).toBeInTheDocument();
    expect(screen.queryByText(/Pickup at/)).not.toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });
});

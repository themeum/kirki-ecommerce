import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ShippingCarrierCard from '@/features/settings/shipping/pages/shipping-carrier/shipping-carrier';
import type {
  ShippingCarrier,
  ShippingCarrierPreset,
} from '@/features/settings/shipping/schemas/catalog/shipping';
import type { ShippingZone } from '@/features/settings/shipping/types';
import type { ShippingSettings } from '@/schemas/catalog/settings';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

const UPS_TEMPLATE = 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}';

const carriers = (): ShippingCarrier[] => [
  {
    id: 'ups',
    preset: 'ups',
    name: 'UPS',
    tracking_url: UPS_TEMPLATE,
    logo: null,
    logo_url: 'https://example.test/ups.svg',
    is_enabled: true,
  },
  {
    id: 'dhl',
    preset: 'dhl',
    name: 'DHL',
    tracking_url: 'https://www.dhl.com/track?id={tracking_number}',
    logo: null,
    logo_url: null,
    is_enabled: false,
  },
];

const presets = (): ShippingCarrierPreset[] => [
  { key: 'ups', name: 'UPS', tracking_url: UPS_TEMPLATE, logo_url: 'https://example.test/ups.svg' },
  {
    key: 'dhl',
    name: 'DHL',
    tracking_url: 'https://www.dhl.com/track?id={tracking_number}',
    logo_url: 'https://example.test/dhl.svg',
  },
  {
    key: 'fedex',
    name: 'FedEx',
    tracking_url: 'https://www.fedex.com/track?n={tracking_number}',
    logo_url: null,
  },
];

const shippingSettings: ShippingSettings = { shipping_carrier_presets: presets() };

const zoneWith = (shippingCarriers: ShippingCarrier[]): ShippingZone => ({
  id: 'zone-1',
  title: 'Domestic',
  is_enabled: true,
  regions: [{ country: 'US', states: [] }],
  shipping_methods: [],
  shipping_carriers: shippingCarriers,
});

let savedZones: ShippingZone[][];

const Harness = ({ initialCarriers }: { initialCarriers: ShippingCarrier[] }) => {
  const [zones, setZones] = useState<ShippingZone[]>([zoneWith(initialCarriers)]);

  return (
    <ShippingCarrierCard
      shippingSettingsData={shippingSettings}
      shippingZonesObj={zones}
      setShippingZonesObj={setZones}
      zoneId="zone-1"
    />
  );
};

const renderCard = (initialCarriers: ShippingCarrier[] = carriers()) => {
  server.use(
    http.put(`${API}/settings`, async ({ request }) => {
      const body = (await request.json()) as { data: { shipping_zones: ShippingZone[] } };
      savedZones.push(body.data.shipping_zones);

      return HttpResponse.json({ success: true, message: 'Saved', data: body.data });
    }),
  );

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <Harness initialCarriers={initialCarriers} />
    </QueryClientProvider>,
  );
};

const openAddMenu = () => {
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Add' }), {
    button: 0,
    ctrlKey: false,
    pointerType: 'mouse',
  });
};

const openNewCarrierPopover = async () => {
  openAddMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Add new' }));

  return screen.findByRole('dialog');
};

const lastSavedCarriers = () => savedZones[savedZones.length - 1][0].shipping_carriers ?? [];

beforeEach(() => {
  savedZones = [];
});

afterEach(cleanup);

describe('ShippingCarrierCard', () => {
  it('lists the carriers with their enabled state and no price', () => {
    renderCard();

    expect(screen.getByText('UPS')).toBeInTheDocument();
    expect(screen.getByText('DHL')).toBeInTheDocument();

    const [upsSwitch, dhlSwitch] = screen.getAllByRole('switch', {
      name: 'Enable shipping carrier',
    });

    expect(upsSwitch).toHaveAttribute('data-state', 'checked');
    expect(dhlSwitch).toHaveAttribute('data-state', 'unchecked');
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Inactive')).toHaveLength(1);
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('shows the Inactive badge on a disabled carrier and no badge on an enabled one', () => {
    renderCard();

    const upsRow = screen.getByText('UPS').closest<HTMLElement>('[data-slot="stacked-item"]')!;
    const dhlRow = screen.getByText('DHL').closest<HTMLElement>('[data-slot="stacked-item"]')!;

    expect(within(upsRow).queryByText('Inactive')).not.toBeInTheDocument();
    expect(within(upsRow).queryByText('Active')).not.toBeInTheDocument();
    expect(within(dhlRow).getByText('Inactive')).toHaveAttribute('data-size', 'sm');
    expect(within(dhlRow).queryByText('Active')).not.toBeInTheDocument();
  });

  it('switches the badge when a carrier is toggled', async () => {
    renderCard();

    fireEvent.click(screen.getAllByRole('switch', { name: 'Enable shipping carrier' })[1]);

    await waitFor(() => expect(screen.queryByText('Inactive')).not.toBeInTheDocument());
    expect(screen.queryByText('Active')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('switch', { name: 'Enable shipping carrier' })[0]);

    await waitFor(() => expect(screen.getAllByText('Inactive')).toHaveLength(1));
  });

  it('shows only the card header and the Add button when the zone has no carriers', () => {
    renderCard([]);

    expect(screen.getByText('Shipping Carriers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.queryByText(/will appear here|Use Add to pick/)).not.toBeInTheDocument();
  });

  it('persists a toggle without an explicit save', async () => {
    renderCard();

    fireEvent.click(screen.getAllByRole('switch', { name: 'Enable shipping carrier' })[1]);

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedCarriers().map((carrier) => [carrier.id, carrier.is_enabled])).toEqual([
      ['ups', true],
      ['dhl', true],
    ]);
  });

  it('lists only the presets the zone does not hold, then "Add new"', () => {
    renderCard();

    openAddMenu();

    expect(screen.getByRole('menuitem', { name: /FedEx/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /UPS/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /DHL/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Add new' })).toBeInTheDocument();
  });

  it('lists every preset when the zone has no carriers', () => {
    renderCard([]);

    openAddMenu();

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'UPS',
      'DHL',
      'FedEx',
      'Add new',
    ]);
  });

  it('shows only "Add new" once the zone holds every preset', () => {
    renderCard([
      ...carriers(),
      {
        id: 'fedex',
        preset: 'fedex',
        name: 'FedEx',
        tracking_url: 'https://x.test/{tracking_number}',
        is_enabled: false,
      },
    ]);

    openAddMenu();

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Add new']);
  });

  it('adds a picked preset as an active carrier and saves it', async () => {
    renderCard([]);

    openAddMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /DHL/ }));

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedCarriers()).toEqual([
      expect.objectContaining({
        id: 'dhl',
        preset: 'dhl',
        name: 'DHL',
        tracking_url: 'https://www.dhl.com/track?id={tracking_number}',
        is_enabled: true,
      }),
    ]);
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();

    openAddMenu();

    expect(screen.queryByRole('menuitem', { name: /DHL/ })).not.toBeInTheDocument();
  });

  it('lists a preset again after the carrier is deleted', async () => {
    renderCard();

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));

    openAddMenu();

    expect(await screen.findByRole('menuitem', { name: /DHL/ })).toBeInTheDocument();
  });

  it('does not add a carrier until the "Add new" popover is saved', async () => {
    renderCard([]);

    const popover = await openNewCarrierPopover();

    expect(within(popover).getByLabelText('URL')).toBeInTheDocument();
    expect(savedZones).toHaveLength(0);
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('leaves the list unchanged when the popover is cancelled', async () => {
    renderCard([]);

    const popover = await openNewCarrierPopover();
    fireEvent.click(within(popover).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(savedZones).toHaveLength(0);
  });

  it('adds a carrier with its template intact', async () => {
    renderCard([]);

    const dialog = await openNewCarrierPopover();

    fireEvent.change(within(dialog).getByPlaceholderText('e.g. UPS'), {
      target: { value: 'Local Courier' },
    });
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://track.example.com/?n={tracking_number}' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));

    const [added] = lastSavedCarriers();

    expect(added).toMatchObject({
      name: 'Local Courier',
      tracking_url: 'https://track.example.com/?n={tracking_number}',
      logo: null,
      preset: null,
      is_enabled: true,
    });
    expect(typeof added.id).toBe('string');
  });

  it('blocks saving a carrier without a name or URL', async () => {
    renderCard([]);

    const dialog = await openNewCarrierPopover();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('Carrier name is required')).toBeInTheDocument();
    expect(within(dialog).getByText('URL is required')).toBeInTheDocument();
    expect(savedZones).toHaveLength(0);
  });

  it('blocks a URL that lacks the placeholder', async () => {
    renderCard([]);

    const dialog = await openNewCarrierPopover();

    fireEvent.change(within(dialog).getByPlaceholderText('e.g. UPS'), { target: { value: 'UPS' } });
    fireEvent.change(within(dialog).getByLabelText('URL'), {
      target: { value: 'https://www.ups.com/track' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText('The URL must contain the {tracking_number} placeholder.'),
    ).toBeInTheDocument();
    expect(savedZones).toHaveLength(0);
  });

  it('edits a carrier and keeps its other fields', async () => {
    renderCard();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByPlaceholderText('e.g. UPS')).toHaveValue('UPS');

    expect(within(dialog).getByLabelText('URL')).toHaveValue(UPS_TEMPLATE);

    fireEvent.change(within(dialog).getByPlaceholderText('e.g. UPS'), {
      target: { value: 'UPS Express' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedCarriers()[0]).toMatchObject({
      id: 'ups',
      preset: 'ups',
      name: 'UPS Express',
      tracking_url: UPS_TEMPLATE,
      is_enabled: true,
    });
    expect(lastSavedCarriers()).toHaveLength(2);
  });

  it('deletes a carrier after confirmation', async () => {
    renderCard();

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(savedZones).toHaveLength(1));
    expect(lastSavedCarriers().map((carrier) => carrier.id)).toEqual(['ups']);
  });
});

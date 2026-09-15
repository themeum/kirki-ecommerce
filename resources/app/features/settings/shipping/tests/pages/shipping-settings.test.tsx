import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ShippingSettings from '@/features/settings/shipping/pages/shipping-settings';
import type { ShippingZone } from '@/features/settings/shipping/types';
import type {
  SettingsLayoutOutletContext,
  SettingsPageActionsInput,
} from '@/features/settings/types';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

const initialZones = (): ShippingZone[] => [
  {
    id: 'zone-1',
    title: 'Domestic',
    is_enabled: true,
    regions: [{ country: 'US', states: [] }],
    shipping_methods: [
      { id: 'method-1', type: 'flat_rate', name: 'Flat Rate', is_enabled: true, base_amount: 10 },
    ],
    shipping_careers: [],
  },
];

let storedZones: ShippingZone[];
let savedPayloads: { shipping_zones: ShippingZone[] }[];
let registeredActions: (SettingsPageActionsInput | null)[];

const emptyList = { results: [], total: 0, per_page: 10 };

const useHandlers = ({ failSave = false } = {}) => {
  savedPayloads = [];

  server.use(
    http.get(`${API}/countries`, () => HttpResponse.json({ data: [] })),
    http.get(`${API}/shipping-profiles`, () => HttpResponse.json({ data: emptyList })),
    http.get(`${API}/shipping-boxes`, () => HttpResponse.json({ data: emptyList })),
    http.get(`${API}/settings/shipping`, () =>
      HttpResponse.json({ data: { shipping_zones: storedZones } }),
    ),
    http.put(`${API}/settings`, async ({ request }) => {
      const body = (await request.json()) as {
        data: { shipping_zones: ShippingZone[] };
      };

      if (failSave) {
        return HttpResponse.json(
          { success: false, message: 'Save failed', errors: {} },
          { status: 500 },
        );
      }

      savedPayloads.push(body.data);
      storedZones = body.data.shipping_zones;

      return HttpResponse.json({
        success: true,
        message: 'Saved',
        data: { shipping_zones: storedZones },
      });
    }),
  );
};

const renderPage = () => {
  registeredActions = [];

  const outletContext: SettingsLayoutOutletContext = {
    confirmAction: ({ action }) => void action?.(),
    registerActions: (actions) => registeredActions.push(actions),
  };

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const router = createMemoryRouter([
    {
      path: '/',
      element: <Outlet context={outletContext} />,
      children: [{ index: true, element: <ShippingSettings /> }],
    },
  ]);

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

const methodSwitch = () => screen.getByRole('switch', { name: 'Enable shipping method' });

const lastSavedZones = () => savedPayloads[savedPayloads.length - 1].shipping_zones;

beforeEach(() => {
  storedZones = initialZones();
});

afterEach(cleanup);

describe('ShippingSettings activation toggles', () => {
  it('persists a shipping method toggle without an explicit save', async () => {
    useHandlers();
    renderPage();

    fireEvent.click(await screen.findByRole('switch', { name: 'Enable shipping method' }));

    await waitFor(() => expect(savedPayloads).toHaveLength(1));
    expect(lastSavedZones()[0].shipping_methods[0].is_enabled).toBe(false);

    await waitFor(() => expect(methodSwitch()).toHaveAttribute('data-state', 'unchecked'));
  });

  it('persists a shipping zone toggle without an explicit save', async () => {
    useHandlers();
    renderPage();

    fireEvent.click(await screen.findByRole('switch', { name: 'Enable shipping method' }));
    await waitFor(() => expect(savedPayloads).toHaveLength(1));

    fireEvent.pointerDown(
      document.querySelector('[aria-haspopup="menu"]')!,
      { button: 0, ctrlKey: false, pointerType: 'mouse' },
    );

    fireEvent.click(await screen.findByText('Deactivate'));

    await waitFor(() => expect(savedPayloads).toHaveLength(2));
    expect(lastSavedZones()[0].is_enabled).toBe(false);
  });

  it('never marks the page dirty, so no unsaved-changes bar appears', async () => {
    useHandlers();
    renderPage();

    fireEvent.click(await screen.findByRole('switch', { name: 'Enable shipping method' }));
    await waitFor(() => expect(savedPayloads).toHaveLength(1));

    expect(registeredActions.every((actions) => !actions?.isDirty)).toBe(true);
  });

  it('rolls the toggle back when the save fails', async () => {
    useHandlers({ failSave: true });
    renderPage();

    const toggle = await screen.findByRole('switch', { name: 'Enable shipping method' });
    expect(toggle).toHaveAttribute('data-state', 'checked');

    fireEvent.click(toggle);

    await waitFor(() => expect(methodSwitch()).toHaveAttribute('data-state', 'unchecked'));
    await waitFor(() => expect(methodSwitch()).toHaveAttribute('data-state', 'checked'));
    expect(savedPayloads).toHaveLength(0);
  });
});

const openZoneMenu = () => {
  fireEvent.pointerDown(
    document.querySelector('[aria-haspopup="menu"]')!,
    { button: 0, ctrlKey: false, pointerType: 'mouse' },
  );
};

const menuItemIcon = (label: string) =>
  screen.getByText(label).closest('[role="menuitem"]')!.querySelector('svg')!;

describe('ShippingSettings zone menu', () => {
  it('marks activation and deactivation with different icons', async () => {
    useHandlers();
    renderPage();

    await screen.findByRole('switch', { name: 'Enable shipping method' });

    openZoneMenu();
    const deactivateIcon = menuItemIcon('Deactivate');
    expect(deactivateIcon).toHaveClass('lucide-ban');

    fireEvent.click(screen.getByText('Deactivate'));
    await waitFor(() => expect(savedPayloads).toHaveLength(1));

    openZoneMenu();
    const activateIcon = await waitFor(() => menuItemIcon('Activate'));
    expect(activateIcon).toHaveClass('lucide-circle-check');
    expect(activateIcon).not.toHaveClass('lucide-ban');
  });
});

const zoneTrigger = (title: string) =>
  screen.getByText(title).closest('button[data-state]')!;

describe('ShippingSettings zone expansion', () => {
  it('does not offer expansion for a zone with no shipping methods', async () => {
    storedZones = [{ ...initialZones()[0], shipping_methods: [] }];
    useHandlers();
    renderPage();

    await screen.findByText('Domestic');

    expect(zoneTrigger('Domestic')).toBeDisabled();
    expect(document.querySelector('[data-accordion-chevron]')).toBeNull();
  });

  it('keeps the zone expandable while it still has shipping methods', async () => {
    useHandlers();
    renderPage();

    await screen.findByRole('switch', { name: 'Enable shipping method' });

    expect(zoneTrigger('Domestic')).toBeEnabled();
    expect(document.querySelector('[data-accordion-chevron]')).not.toBeNull();
  });
});

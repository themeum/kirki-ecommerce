import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import ShippingProfile from '@/features/settings/shipping/pages/shipping-profile/shipping-profile';
import { server } from '@/tests/msw/server';

const API = 'https://example.test/wp-json/kirki/ecommerce/v1';

let createdProfiles: { name: string; is_default: boolean }[];

const storedProfiles = [{ id: 7, name: 'Fragile', is_default: false }];

const useHandlers = () => {
  createdProfiles = [];

  server.use(
    http.get(`${API}/shipping-profiles`, () =>
      HttpResponse.json({
        data: { results: storedProfiles, total: storedProfiles.length, per_page: 10 },
      }),
    ),
    http.post(`${API}/shipping-profiles`, async ({ request }) => {
      const body = (await request.json()) as { name: string; is_default: boolean };
      createdProfiles.push(body);

      return HttpResponse.json({
        success: true,
        message: 'Created',
        data: { id: 8, name: body.name, is_default: body.is_default },
      });
    }),
  );
};

const renderCard = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ShippingProfile />
    </QueryClientProvider>,
  );
};

const addButton = () => screen.getByRole('button', { name: 'Add' });

beforeEach(useHandlers);
afterEach(cleanup);

describe('ShippingProfile add flow', () => {
  it('opens the create form in a popover anchored to the Add button', async () => {
    renderCard();

    fireEvent.click(addButton());

    const title = await screen.findByLabelText('Title');

    expect(title.closest('[data-side]')).not.toBeNull();
    expect(screen.queryByText('Create shipping profile')).not.toBeInTheDocument();
  });

  it('creates the profile from the popover and closes it', async () => {
    renderCard();

    fireEvent.click(addButton());
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Bulky' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(createdProfiles).toHaveLength(1));
    expect(createdProfiles[0].name).toBe('Bulky');

    await waitFor(() => expect(screen.queryByLabelText('Title')).not.toBeInTheDocument());
  });

  it('keeps save unreachable until a title is typed', async () => {
    renderCard();

    fireEvent.click(addButton());
    await screen.findByLabelText('Title');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('still edits an existing profile through the dialog', async () => {
    renderCard();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));

    expect(await screen.findByText('Create shipping profile')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Fragile'));
  });
});

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider, useOutletContext } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ContextReader = () => {
  const { label } = useOutletContext<{ label: string }>();

  return <div>{label}</div>;
};

const renderRoutes = async (isOnboarded: boolean, initialPath: string) => {
  window.kirki_ecommerce.is_onboarded = isOnboarded;
  vi.resetModules();

  const { default: OnboardingGate } = await import('@/features/onboarding/components/onboarding-gate');
  const { default: Onboarding } = await import('@/features/onboarding/pages/onboarding');

  const router = createMemoryRouter(
    [
      { path: '/onboarding/*', element: <Onboarding /> },
      {
        element: <Outlet context={{ label: 'Shell context' }} />,
        children: [
          {
            element: <OnboardingGate />,
            children: [
              { path: '/', element: <div>Home</div> },
              { path: '/products', element: <div>Products</div> },
              { path: '/settings', element: <ContextReader /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);

  return router;
};

describe('onboarding gate', () => {
  afterEach(() => {
    cleanup();
    window.kirki_ecommerce.is_onboarded = true;
  });

  it('sends a store that is not onboarded from a plugin route to the wizard', async () => {
    const router = await renderRoutes(false, '/products');

    expect(router.state.location.pathname).toBe('/onboarding');
  });

  it('lets an onboarded store reach plugin routes', async () => {
    await renderRoutes(true, '/products');

    expect(screen.getByText('Products')).toBeInTheDocument();
  });

  it('passes the parent outlet context through to the gated pages', async () => {
    await renderRoutes(true, '/settings');

    expect(screen.getByText('Shell context')).toBeInTheDocument();
  });

  it('sends an onboarded store away from the wizard', async () => {
    const router = await renderRoutes(true, '/onboarding');

    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

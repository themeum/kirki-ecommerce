import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import type { SettingsBreadcrumb } from '@/features/settings/pages/settings-page-header';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';

const renderHeader = (breadcrumbs: SettingsBreadcrumb[] = []) => {
  const router = createMemoryRouter([
    {
      path: '/',
      element: (
        <SettingsPageHeader
          icon={<span data-testid="page-icon" />}
          title="Color"
          breadcrumbs={breadcrumbs}
        />
      ),
    },
  ]);

  return render(<RouterProvider router={router} />);
};

const getSeparators = (container: HTMLElement) =>
  container.querySelectorAll('svg[aria-hidden="true"]');

afterEach(cleanup);

describe('SettingsPageHeader', () => {
  it('does not separate the root icon from the first crumb', () => {
    const { container } = renderHeader([{ label: 'Essentials', to: '/settings/essentials' }]);

    expect(screen.getByTestId('page-icon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Essentials' })).toBeInTheDocument();
    expect(getSeparators(container)).toHaveLength(1);
  });

  it('separates each crumb from the next', () => {
    const { container } = renderHeader([
      { label: 'Essentials', to: '/settings/essentials' },
      { label: 'Variations', to: '/settings/essentials/variations' },
    ]);

    expect(getSeparators(container)).toHaveLength(2);
  });

  it('renders no separator without breadcrumbs', () => {
    const { container } = renderHeader();

    expect(getSeparators(container)).toHaveLength(0);
  });
});

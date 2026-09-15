import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import SettingsSidebar from '@/features/settings/pages/settings-sidebar';

const renderSidebar = (entry: string) => {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <SettingsSidebar />
    </MemoryRouter>,
  );
};

afterEach(cleanup);

describe('SettingsSidebar', () => {
  it('shows the navigation sections when the url carries no query', async () => {
    renderSidebar('/settings/general');

    expect(await screen.findByText('Store')).toBeInTheDocument();
  });

  it('restores the search results from the url on mount', async () => {
    renderSidebar('/settings/general?q=tax');

    expect(screen.getByDisplayValue('tax')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Store')).not.toBeInTheDocument();
      expect(document.querySelectorAll('mark').length).toBeGreaterThan(0);
    });
  });

  it('reports no results for a query that matches nothing', async () => {
    renderSidebar('/settings/general?q=zzzz');

    expect(await screen.findByText('No results found')).toBeInTheDocument();
  });
});

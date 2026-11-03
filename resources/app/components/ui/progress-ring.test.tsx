import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProgressRing from '@/components/ui/progress-ring';

describe('ProgressRing', () => {
  afterEach(cleanup);

  it('reports its percent', () => {
    render(<ProgressRing percent={40} label="Migration" />);

    expect(screen.getByRole('progressbar', { name: 'Migration' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
  });

  it('keeps the percent between 0 and 100', () => {
    render(<ProgressRing percent={140} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

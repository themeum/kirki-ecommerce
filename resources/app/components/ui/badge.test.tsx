import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Badge from '@/components/ui/badge';

afterEach(cleanup);

describe('Badge', () => {
  it('uses the default size when no size is given', () => {
    render(<Badge>Label</Badge>);

    expect(screen.getByText('Label')).toHaveAttribute('data-size', 'default');
  });

  it('marks the small size', () => {
    render(<Badge size="sm">Label</Badge>);

    expect(screen.getByText('Label')).toHaveAttribute('data-size', 'sm');
  });

  it('keeps the variant when the size changes', () => {
    render(
      <Badge variant="success" size="sm">
        Label
      </Badge>,
    );

    expect(screen.getByText('Label')).toHaveAttribute('data-variant', 'success');
  });
});

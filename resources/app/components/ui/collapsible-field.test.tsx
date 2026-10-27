import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import CollapsibleField from '@/components/ui/collapsible-field';

const ADD_LABEL = 'Add ribbon';

afterEach(cleanup);

describe('CollapsibleField', () => {
  it('shows only the add link while the value is empty', () => {
    render(
      <CollapsibleField addLabel={ADD_LABEL}>
        <input aria-label="Ribbon" />
      </CollapsibleField>,
    );

    expect(screen.getByRole('button', { name: ADD_LABEL })).toBeInTheDocument();
    expect(screen.queryByLabelText('Ribbon')).not.toBeInTheDocument();
  });

  it('replaces the link with the field when activated', () => {
    render(
      <CollapsibleField addLabel={ADD_LABEL}>
        <input aria-label="Ribbon" />
      </CollapsibleField>,
    );

    fireEvent.click(screen.getByRole('button', { name: ADD_LABEL }));

    expect(screen.getByLabelText('Ribbon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ADD_LABEL })).not.toBeInTheDocument();
  });

  it('starts expanded when the value is already set', () => {
    render(
      <CollapsibleField addLabel={ADD_LABEL} hasValue>
        <input aria-label="Ribbon" />
      </CollapsibleField>,
    );

    expect(screen.getByLabelText('Ribbon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ADD_LABEL })).not.toBeInTheDocument();
  });

  it('stays expanded when the value is cleared mid-edit', () => {
    const Harness = () => {
      const [value, setValue] = useState('Fresh Arrival');

      return (
        <CollapsibleField addLabel={ADD_LABEL} hasValue={Boolean(value)}>
          <input aria-label="Ribbon" value={value} onChange={(e) => setValue(e.target.value)} />
        </CollapsibleField>
      );
    };

    render(<Harness />);

    fireEvent.change(screen.getByLabelText('Ribbon'), { target: { value: '' } });

    expect(screen.getByLabelText('Ribbon')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ADD_LABEL })).not.toBeInTheDocument();
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import TabsField from '@/components/form/tabs-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const positions = ['left', 'center', 'right'];

const renderField = (position = 'left') => {
  render(
    <FormHarness defaultValues={{ position }}>
      <TabsField
        name="position"
        label="Alignment"
        options={[
          { value: '0', label: 'Left' },
          { value: '1', label: 'Center' },
          { value: '2', label: 'Right' },
        ]}
        toTabValue={(value) => String(positions.indexOf(String(value)))}
        fromTabValue={(value) => positions[Number(value)]}
      />
      <ValueProbe name="position" />
      <ErrorButton name="position" message="Choose an alignment" />
    </FormHarness>,
  );
};

afterEach(cleanup);

describe('TabsField', () => {
  it('renders the label and every tab', () => {
    renderField();

    expect(screen.getByText('Alignment')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks the tab matching the mapped form value as selected', () => {
    renderField('center');

    expect(screen.getByRole('tab', { name: 'Center' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('writes the mapped-back value when a tab is selected', () => {
    renderField();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Right' }), { button: 0 });

    expect(screen.getByTestId('probe-position').textContent).toBe('"right"');
  });

  it('renders the error and marks the tab list invalid', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-position' }));

    expect(screen.getByText('Choose an alignment')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-invalid', 'true');
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FieldValues } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import UnitAmountField from '@/components/form/unit-amount-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const renderField = (
  defaultValues: FieldValues = { base_unit_amount: '', base_unit: 'g' },
) => {
  render(
    <FormHarness defaultValues={defaultValues}>
      <UnitAmountField
        name="base_unit_amount"
        unitName="base_unit"
        label="Base unit"
        placeholder="1"
        unitOptions={[
          { value: 'g', label: 'Gram' },
          { value: 'kg', label: 'Kilogram' },
        ]}
      />
      <ValueProbe name="base_unit_amount" />
      <ErrorButton name="base_unit" message="Pick a unit" />
      <ErrorButton name="base_unit_amount" message="Amount is required" />
    </FormHarness>,
  );

  return screen.getByPlaceholderText('1');
};

afterEach(cleanup);

describe('UnitAmountField', () => {
  it('renders the label and the current amount', () => {
    const input = renderField({ base_unit_amount: '500', base_unit: 'g' });

    expect(screen.getByText('Base unit')).toBeInTheDocument();
    expect(input).toHaveValue(500);
  });

  it('writes the typed amount to the amount field', () => {
    const input = renderField();

    fireEvent.change(input, { target: { value: '250' } });

    expect(screen.getByTestId('probe-base_unit_amount').textContent).toBe('"250"');
  });

  it('surfaces an error from the unit name in the shared error row', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-base_unit' }));

    expect(screen.getByText('Pick a unit')).toBeInTheDocument();
  });

  it('clears errors on both names when the amount changes', () => {
    const input = renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-base_unit' }));
    fireEvent.click(screen.getByRole('button', { name: 'inject-base_unit_amount' }));

    expect(screen.getByText('Amount is required')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '10' } });

    expect(screen.queryByText('Amount is required')).not.toBeInTheDocument();
    expect(screen.queryByText('Pick a unit')).not.toBeInTheDocument();
  });
});

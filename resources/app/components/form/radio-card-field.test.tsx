import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import RadioCardField from '@/components/form/radio-card-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const options = [
  { value: 'amount-off', label: 'Amount Off', icon: <span>$</span> },
  { value: 'free-shipping', label: 'Free Shipping' },
];

const renderField = (discountType: string | null = null) => {
  render(
    <FormHarness defaultValues={{ discount_type: discountType }}>
      <RadioCardField
        name="discount_type"
        label="Discount Type"
        options={options}
      />
      <ValueProbe name="discount_type" />
      <ErrorButton name="discount_type" message="Pick a discount type" />
    </FormHarness>,
  );
};

afterEach(cleanup);

describe('RadioCardField', () => {
  it('renders the field label and every option label', () => {
    renderField();

    expect(screen.getByText('Discount Type')).toBeInTheDocument();
    expect(screen.getByText('Amount Off')).toBeInTheDocument();
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
  });

  it('reflects the current value as the checked option', () => {
    renderField('free-shipping');

    expect(screen.getByRole('radio', { name: /Free Shipping/ })).toBeChecked();
  });

  it('writes the selected option value to form state', () => {
    renderField();

    fireEvent.click(screen.getByRole('radio', { name: /Amount Off/ }));

    expect(screen.getByTestId('probe-discount_type').textContent).toBe('"amount-off"');
  });

  it('renders the error and marks the group invalid', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-discount_type' }));

    expect(screen.getByText('Pick a discount type')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
  });
});

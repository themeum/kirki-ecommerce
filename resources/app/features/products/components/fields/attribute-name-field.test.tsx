import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FieldValues } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import AttributeNameField from '@/features/products/components/fields/attribute-name-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const suggestions = [
  { value: 1, title: 'Size', type: 'list' },
  { value: 2, title: 'Material', type: 'list' },
];

const renderField = (
  defaultValues: FieldValues = { id: undefined, name: '', type: 'list', values: [] },
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <FormHarness defaultValues={defaultValues}>
        <AttributeNameField
          label="Variation Name"
          suggestions={suggestions}
          placeholder="e.g. Size or Material"
          addItemLabel="Add Attribute"
        />
        <ValueProbe name="id" />
        <ValueProbe name="name" />
        <ValueProbe name="values" />
        <ErrorButton name="name" message="Variation name is required" />
      </FormHarness>
    </QueryClientProvider>,
  );

  return screen.getByRole('combobox');
};

afterEach(cleanup);

describe('AttributeNameField', () => {
  it('renders the label and the placeholder while nothing is selected', () => {
    renderField();

    expect(screen.getByText('Variation Name')).toBeInTheDocument();
    expect(screen.getByText('e.g. Size or Material')).toBeInTheDocument();
  });

  it('shows the attribute already held in form state and locks the control', () => {
    const trigger = renderField({
      id: 2,
      name: 'Material',
      type: 'list',
      values: [],
    });

    expect(trigger).toHaveTextContent('Material');
    expect(trigger).toBeDisabled();
  });

  it('writes the picked attribute id and name, and clears the values', () => {
    const trigger = renderField({
      id: undefined,
      name: '',
      type: 'list',
      values: [{ value: 9, title: 'Small' }],
    });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Material'));

    expect(screen.getByTestId('probe-id').textContent).toBe('2');
    expect(screen.getByTestId('probe-name').textContent).toBe('"Material"');
    expect(screen.getByTestId('probe-values').textContent).toBe('[]');
  });

  it('surfaces an error reported on the sibling name field', () => {
    renderField();

    fireEvent.click(
      screen.getByRole('button', { name: 'inject-name' }),
    );

    expect(screen.getByText('Variation name is required')).toBeInTheDocument();
  });
});

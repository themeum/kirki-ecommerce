import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FieldValues } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import SchemaPropertyField from '@/features/settings/essentials/components/fields/schema-property-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const renderField = (schema: FieldValues = { Product: ['name', 'image'] }) => {
  render(
    <FormHarness defaultValues={{ schema }}>
      <SchemaPropertyField name="schema" label="Schema properties" />
      <ValueProbe name="schema" />
      <ErrorButton name="schema" message="Select at least one property" />
    </FormHarness>,
  );
};

afterEach(cleanup);

describe('SchemaPropertyField', () => {
  it('renders the label, type title and each selected property from form state', () => {
    renderField();

    expect(screen.getByText('Schema properties')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('image')).toBeInTheDocument();
  });

  it('keeps the required property when a type is cleared', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(screen.getByTestId('probe-schema').textContent).toBe(
      '{"Product":["name"]}',
    );
  });

  it('drops the type entirely when it has no required property', () => {
    renderField({ Brand: ['logo'] });

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }));

    expect(screen.getByTestId('probe-schema').textContent).toBe('{}');
  });

  it('renders the error', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-schema' }));

    expect(screen.getByText('Select at least one property')).toBeInTheDocument();
  });
});

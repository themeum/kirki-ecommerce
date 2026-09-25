import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import AttributeValuesField from '@/features/products/components/fields/attribute-values-field';
import type { AttributeValue } from '@/features/products/schemas/catalog/attribute';
import type { ProductAttributeValueInput } from '@/features/products/schemas/forms/product-attribute-form';
import { FormHarness, ValueProbe } from '@/tests/form-field-harness';

const COLOR_VALUES: AttributeValue[] = [
  { id: 11, value: 'Blue', color: '#0000ff' },
  { id: 12, value: 'Orange', color: '#ffa500' },
];

type RenderFieldOptions = {
  type?: string;
  existingValues?: AttributeValue[];
  defaultValues?: { values: ProductAttributeValueInput[] };
};

const renderField = ({
  type = 'list',
  existingValues = [],
  defaultValues = { values: [] },
}: RenderFieldOptions = {}) => {
  render(
    <FormHarness defaultValues={defaultValues}>
      <AttributeValuesField existingValues={existingValues} type={type} />
      <ValueProbe name="values" />
    </FormHarness>,
  );
};

const input = () => screen.getByRole('combobox');

const open = () => fireEvent.click(input().parentElement!);

const type = (term: string) => fireEvent.change(input(), { target: { value: term } });

const probe = () => JSON.parse(screen.getByTestId('probe-values').textContent ?? 'null') as unknown[];

afterEach(cleanup);

describe('AttributeValuesField', () => {
  it('creates a list value as a draft on Enter', () => {
    renderField();
    open();
    type('XXL');
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(probe()).toEqual([{ value: 'XXL', color: null }]);
  });

  it('resolves a named colour when a colour value is typed', () => {
    renderField({ type: 'color' });
    open();
    type('Light Blue');
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(probe()).toEqual([{ value: 'Light Blue', color: '#add8e6' }]);
  });

  it('leaves the colour empty for a name it does not recognise', () => {
    renderField({ type: 'color' });
    open();
    type('Sky');
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(probe()).toEqual([{ value: 'Sky', color: null }]);
  });

  it('opens the dialog rather than offering to add a name that already exists', () => {
    renderField({ type: 'color', existingValues: COLOR_VALUES });
    open();
    type('blue');
    fireEvent.click(screen.getByRole('button', { name: 'Add new value' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(probe()).toEqual([]);
  });

  it('reads the typed text back in the pinned action until it matches a value', () => {
    renderField({ existingValues: [{ id: 21, value: 'S' }] });
    open();

    expect(screen.getByRole('button', { name: 'Add new value' })).toBeInTheDocument();

    type('XL');
    expect(screen.getByRole('button', { name: 'Add "XL"' })).toBeInTheDocument();

    type('s');
    expect(screen.getByRole('button', { name: 'Add new value' })).toBeInTheDocument();
  });

  it('creates from the pinned action with the typed text', () => {
    renderField();
    open();
    type('XL');
    fireEvent.click(screen.getByRole('button', { name: 'Add "XL"' }));

    expect(probe()).toEqual([{ value: 'XL', color: null }]);
  });

  it('asks for a title and a colour for colour attributes', () => {
    renderField({ type: 'color' });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add new value' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Add Color');
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('asks for a title only for list attributes', () => {
    renderField();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Add new value' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Add Value');
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
  });

  it('keeps the original colour beside a value picked from the list', () => {
    renderField({ type: 'color', existingValues: COLOR_VALUES });
    open();
    fireEvent.click(screen.getByRole('option', { name: /Orange/ }));

    expect(probe()).toEqual([{ id: 12, value: 'Orange', color: '#ffa500', original_color: '#ffa500' }]);
  });

  it('selects the existing value when its name is typed and Enter is pressed', () => {
    renderField({ existingValues: [{ id: 21, value: 'S' }] });
    open();
    type('s');
    fireEvent.keyDown(input(), { key: 'Enter' });

    expect(probe()).toEqual([{ id: 21, value: 'S', color: null, original_color: null }]);
  });

  it('recolors a value from its chip swatch as a draft', () => {
    renderField({
      type: 'color',
      existingValues: COLOR_VALUES,
      defaultValues: { values: [{ id: 11, value: 'Blue', color: '#0000ff', original_color: '#0000ff' }] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Change the colour of Blue' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Hex color value' }), { target: { value: '#0000cc' } });

    expect(probe()).toEqual([{ id: 11, value: 'Blue', color: '#0000cc', original_color: '#0000ff' }]);
  });
});

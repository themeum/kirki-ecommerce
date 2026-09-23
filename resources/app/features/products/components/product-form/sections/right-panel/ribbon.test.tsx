import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vitest';

import Ribbon from '@/features/products/components/product-form/sections/right-panel/ribbon';
import { RIBBON_COLOR_PALETTE } from '@/features/products/schemas/forms/product-basics-form';

type RibbonValues = { ribbon: string; ribbon_color: string | null };

let latest: RibbonValues;

const Harness = ({ initial }: { initial?: Partial<RibbonValues> }) => {
  const form = useForm<RibbonValues>({
    defaultValues: { ribbon: '', ribbon_color: RIBBON_COLOR_PALETTE[0], ...initial },
  });
  latest = form.watch();

  return (
    <FormProvider {...form}>
      <Ribbon />
    </FormProvider>
  );
};

const addLink = () => screen.getByRole('button', { name: 'Add ribbon' });
const removeButton = () => screen.getByRole('button', { name: 'Remove ribbon' });
const textInput = () => screen.getByPlaceholderText('e.g. Fresh Arrival');
const swatch = (color: string) => screen.getByRole('radio', { name: `Ribbon colour ${color}` });
const customSwatch = () => screen.getByRole('radio', { name: /custom ribbon colour/i });
const hexInput = () => screen.getByLabelText('Hex color value');

afterEach(() => {
  cleanup();
});

describe('Ribbon field', () => {
  it('shows "Preview" on the first palette colour when opened with no ribbon', () => {
    render(<Harness initial={{ ribbon: '', ribbon_color: null }} />);

    fireEvent.click(addLink());

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(swatch(RIBBON_COLOR_PALETTE[0])).toHaveAttribute('aria-checked', 'true');
  });

  it('updates the preview as the merchant types', () => {
    render(<Harness initial={{ ribbon: '', ribbon_color: null }} />);

    fireEvent.click(addLink());
    fireEvent.change(textInput(), { target: { value: 'Fresh Arrival' } });

    expect(screen.getByText('FRESH ARRIVAL')).toBeInTheDocument();
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
  });

  it('marks a chosen colour as current and redraws the preview', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: RIBBON_COLOR_PALETTE[0] }} />);

    fireEvent.click(swatch(RIBBON_COLOR_PALETTE[2]));

    expect(swatch(RIBBON_COLOR_PALETTE[2])).toHaveAttribute('aria-checked', 'true');
    expect(swatch(RIBBON_COLOR_PALETTE[0])).toHaveAttribute('aria-checked', 'false');
    expect(latest.ribbon_color).toBe(RIBBON_COLOR_PALETTE[2]);
  });

  it('clears both the text and the colour when removed', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: RIBBON_COLOR_PALETTE[2] }} />);

    fireEvent.click(removeButton());

    expect(latest.ribbon).toBe('');
    expect(latest.ribbon_color).toBeNull();
    expect(addLink()).toBeInTheDocument();
  });

  it('shows the custom swatch as an empty add control while a default colour is current', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: RIBBON_COLOR_PALETTE[0] }} />);

    expect(customSwatch()).toHaveAttribute('aria-checked', 'false');
    expect(customSwatch()).toHaveAccessibleName('Add a custom ribbon colour');
  });

  it('marks the custom swatch as current when the stored colour is not a default', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: '#123456' }} />);

    expect(customSwatch()).toHaveAttribute('aria-checked', 'true');
    RIBBON_COLOR_PALETTE.forEach((color) => {
      expect(swatch(color)).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('picking a custom colour from the picker updates the ribbon colour', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: RIBBON_COLOR_PALETTE[0] }} />);

    fireEvent.click(customSwatch());
    fireEvent.change(hexInput(), { target: { value: '#123456' } });

    expect(latest.ribbon_color).toBe('#123456');
  });

  it('remembers the custom colour after switching to a default swatch', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: RIBBON_COLOR_PALETTE[0] }} />);

    fireEvent.click(customSwatch());
    fireEvent.change(hexInput(), { target: { value: '#123456' } });
    fireEvent.click(swatch(RIBBON_COLOR_PALETTE[1]));

    expect(latest.ribbon_color).toBe(RIBBON_COLOR_PALETTE[1]);
    expect(customSwatch()).toHaveAttribute('aria-checked', 'false');
    expect(customSwatch()).toHaveAccessibleName('Custom ribbon colour #123456, editable');

    fireEvent.click(customSwatch());

    expect(latest.ribbon_color).toBe('#123456');
  });

  it('marks a remembered custom colour as editable, distinct from the default swatches', () => {
    render(<Harness initial={{ ribbon: 'Fresh Arrival', ribbon_color: '#123456' }} />);

    expect(customSwatch()).toHaveAccessibleName('Custom ribbon colour #123456, editable');
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Brand from '@/features/products/components/product-form/sections/right-panel/brand';

const LOGO_URL = 'https://example.test/a.png';

const BRANDS = [
  { id: 1, name: 'Aurora', slug: 'aurora', logo: { id: 9, url: LOGO_URL } },
  { id: 2, name: 'Bellweather', slug: 'bellweather', logo: null },
];

vi.mock('@/features/brands', () => ({
  useBrandsQuery: () => ({ data: { results: BRANDS } }),
  BrandAddEditPopover: ({ brand }: { brand: { name: string } }) => (
    <div data-testid="brand-popover">{brand.name}</div>
  ),
}));

type BrandRef = { id: number; name: string; logo: unknown } | null;

let latest: BrandRef;

const Harness = ({ initial = null }: { initial?: BrandRef }) => {
  const form = useForm({ defaultValues: { brand: initial } });
  latest = form.watch('brand');

  return (
    <FormProvider {...form}>
      <Brand />
    </FormProvider>
  );
};

const searchInput = () => screen.getByRole('combobox');

/**
 * With a brand held the box withdraws its text cursor, so there is no
 * `combobox` left to click. The box is the first presentational node the
 * field renders, either way.
 */
const box = (container: HTMLElement) => container.querySelector('[role="presentation"]')!;

const optionRow = (name: string) => screen.getByRole('option', { name: new RegExp(name) });

const rowImage = (name: string) => optionRow(name).querySelector('img');

const removeButtons = () => screen.queryAllByRole('button', { name: 'Remove' });

afterEach(() => {
  latest = null;
  cleanup();
});

describe('Brand field', () => {
  it('shows the placeholder and no chip when no brand is chosen', () => {
    render(<Harness />);

    expect(searchInput()).toHaveAttribute('placeholder', 'Add brand');
    expect(removeButtons()).toHaveLength(0);
  });

  it('shows the held brand as a chip instead of the text cursor', () => {
    const { container } = render(<Harness initial={{ id: 1, name: 'Aurora', logo: null }} />);

    expect(box(container)).toHaveTextContent('Aurora');
    expect(removeButtons()).toHaveLength(1);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows the held brand logo on the chip', () => {
    const { container } = render(
      <Harness initial={{ id: 1, name: 'Aurora', logo: BRANDS[0].logo }} />,
    );

    expect(box(container).querySelector('img')).toHaveAttribute('src', LOGO_URL);
  });

  it('shows a logo on the row of a brand that has one', () => {
    const { container } = render(<Harness />);

    fireEvent.click(box(container));

    expect(rowImage('Aurora')).toHaveAttribute('src', LOGO_URL);
  });

  it('falls back to the placeholder image on a row with no logo', () => {
    const { container } = render(<Harness />);

    fireEvent.click(box(container));

    expect(rowImage('Bellweather')).toBeInTheDocument();
    expect(rowImage('Bellweather')).not.toHaveAttribute('src', LOGO_URL);
  });

  it('offers no checkbox on its rows, holding one brand', () => {
    const { container } = render(<Harness />);

    fireEvent.click(box(container));

    expect(optionRow('Aurora').querySelector('[data-state]')).not.toBeInTheDocument();
  });

  it('writes the chosen brand to the form and closes the panel', () => {
    const { container } = render(<Harness />);

    fireEvent.click(box(container));
    fireEvent.click(optionRow('Aurora'));

    expect(latest).toMatchObject({ id: 1, name: 'Aurora' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('replaces the held brand rather than adding to it', () => {
    const { container } = render(<Harness initial={{ id: 1, name: 'Aurora', logo: null }} />);

    fireEvent.click(box(container));
    fireEvent.click(optionRow('Bellweather'));

    expect(latest).toMatchObject({ id: 2, name: 'Bellweather' });
    expect(removeButtons()).toHaveLength(1);
    expect(box(container)).not.toHaveTextContent('Aurora');
  });

  it('clears the brand from the chip remove control', () => {
    render(<Harness initial={{ id: 1, name: 'Aurora', logo: null }} />);

    fireEvent.click(removeButtons()[0]);

    expect(latest).toBeNull();
    expect(searchInput()).toHaveAttribute('placeholder', 'Add brand');
  });

  it('opens the create popover prefilled with the typed name', () => {
    const { container } = render(<Harness />);

    fireEvent.click(box(container));
    fireEvent.change(searchInput(), { target: { value: 'Cormorant' } });
    fireEvent.click(screen.getByRole('button', { name: /Create "Cormorant"/ }));

    expect(screen.getByTestId('brand-popover')).toHaveTextContent('Cormorant');
  });
});

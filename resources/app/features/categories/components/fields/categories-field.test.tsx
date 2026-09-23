import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CategoriesField from '@/features/categories/components/fields/categories-field';

const CATEGORIES = [
  { id: 1, name: 'Clothing Tops', parent_id: null },
  { id: 2, name: 'Hoodies', parent_id: 1 },
  { id: 3, name: 'Vintage', parent_id: 2 },
  { id: 4, name: 'Sneakers', parent_id: null },
];

const mutateAsync = vi.fn();

vi.mock('@/features/categories/services/category', () => ({
  useCategoriesQuery: () => ({ data: { results: CATEGORIES } }),
  useCreateCategoryMutation: () => ({ mutateAsync, isPending: false }),
}));

type CategoryRef = { id: number; name: string; parent_id: number | null };

const Harness = ({ initial = [] }: { initial?: CategoryRef[] }) => {
  const form = useForm({ defaultValues: { categories: initial } });

  return (
    <FormProvider {...form}>
      <CategoriesField name="categories" label="Categories" />
    </FormProvider>
  );
};

const searchInput = () => screen.getByRole('combobox');

const box = () => searchInput().parentElement!;

const open = () => fireEvent.click(box());

const type = (term: string) => fireEvent.change(searchInput(), { target: { value: term } });

const optionRow = (title: string) => screen.getByRole('option', { name: new RegExp(title) });

const rowLabels = () => screen.queryAllByRole('option').map((row) => row.textContent);

/**
 * The indent sits on the row element itself, not on a span inside it, so
 * the checkbox moves with the name. Read off the inline style rather than
 * through `toHaveStyle`, which keeps the assertion honest about where the
 * indent lives. Only the px step is asserted: the declaration is a `calc`
 * over the row's own padding, and jsdom reorders its terms when it
 * serializes it back.
 */
const rowIndent = (title: string) => optionRow(title).style.paddingLeft;

beforeEach(() => {
  mutateAsync.mockReset();
});

afterEach(cleanup);

describe('CategoriesField list', () => {
  it('orders the tree depth-first and indents the whole row by depth while browsing', () => {
    render(<Harness />);

    open();

    expect(rowLabels()).toEqual(['Clothing Tops', 'Hoodies', 'Vintage', 'Sneakers']);
    expect(rowIndent('Hoodies')).toContain('16px');
    expect(rowIndent('Vintage')).toContain('32px');
    expect(rowIndent('Clothing Tops')).toBe('');
  });

  it('carries the checkbox inward with the name', () => {
    render(<Harness />);

    open();

    const parent = optionRow('Clothing Tops').querySelector('[data-state]')!;
    const child = optionRow('Hoodies').querySelector('[data-state]')!;

    // Neither checkbox carries an indent of its own, so the row's is the
    // only thing that can separate them.
    expect(parent.parentElement).toBe(optionRow('Clothing Tops'));
    expect(child.parentElement).toBe(optionRow('Hoodies'));
    expect(rowIndent('Hoodies')).not.toBe(rowIndent('Clothing Tops'));
  });

  it('shows the full ancestor path instead of indentation while searching', () => {
    render(<Harness />);

    open();
    type('Vintage');

    expect(optionRow('Vintage')).toHaveTextContent('Clothing Tops › Hoodies › Vintage');
    expect(rowIndent('Vintage')).toBe('');
    expect(screen.getByRole('option', { name: /^Clothing Tops$/ })).not.toHaveAttribute('style');
  });

  it('keeps the ancestors of a match that do not match themselves', () => {
    render(<Harness />);

    open();
    type('Vintage');

    expect(rowLabels()).toHaveLength(3);
    expect(screen.getByRole('option', { name: /^Clothing Tops$/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sneakers' })).not.toBeInTheDocument();
  });
});

describe('CategoriesField selection', () => {
  it('does not cascade to children when a parent is checked', () => {
    render(<Harness />);

    open();
    fireEvent.click(optionRow('Clothing Tops'));

    expect(optionRow('Hoodies').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'unchecked',
    );
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
  });

  it('does not drop ancestors when a child is unchecked', () => {
    render(
      <Harness
        initial={[
          { id: 1, name: 'Clothing Tops', parent_id: null },
          { id: 2, name: 'Hoodies', parent_id: 1 },
        ]}
      />,
    );

    open();
    fireEvent.click(optionRow('Hoodies'));

    expect(optionRow('Clothing Tops').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  it('shows the full path in a chip', () => {
    render(<Harness initial={[{ id: 3, name: 'Vintage', parent_id: 2 }]} />);

    expect(box()).toHaveTextContent('Clothing Tops › Hoodies › Vintage');
  });

  it('shows one chip and collapses the rest behind a counter', () => {
    render(
      <Harness
        initial={[
          { id: 1, name: 'Clothing Tops', parent_id: null },
          { id: 2, name: 'Hoodies', parent_id: 1 },
          { id: 4, name: 'Sneakers', parent_id: null },
        ]}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '+2 more' })).toBeInTheDocument();
  });
});

describe('CategoriesField creation', () => {
  it('opens the form seeded with the typed name and selects what it creates', async () => {
    mutateAsync.mockResolvedValue({ data: { id: 9, name: 'Beanies', parent_id: null } });

    render(<Harness />);

    open();
    type('Beanies');
    fireEvent.click(screen.getByRole('button', { name: /Add "Beanies"/ }));

    expect(screen.getByDisplayValue('Beanies')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await vi.waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1),
    );

    expect(box()).toHaveTextContent('Beanies');
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: 'Beanies' }));
  });

  it('offers nothing to create with nothing typed', () => {
    render(<Harness />);

    open();

    expect(screen.queryByRole('button', { name: /Add|New category/ })).not.toBeInTheDocument();
  });
});

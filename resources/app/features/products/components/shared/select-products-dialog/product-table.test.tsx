import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProductTable from '@/features/products/components/shared/select-products-dialog/product-table';
import { SelectProductsProvider } from '@/features/products/components/shared/select-products-dialog/select-products-context';
import type {
  ProductSelection,
  SelectProductsMode,
} from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';

const priceTextRenders = vi.hoisted(() => ({ count: 0 }));

vi.mock('@/components/ui/price-text', () => ({
  default: () => {
    priceTextRenders.count += 1;
    return null;
  },
}));

const buildItem = (id: number) => {
  const selection = {
    productId: id,
    productTitle: `Product ${id}`,
    variants: [
      { variantId: id * 10, variantLabel: `Variant ${id}a`, regularPrice: { display: '$1.00' } },
      {
        variantId: id * 10 + 1,
        variantLabel: `Variant ${id}b`,
        regularPrice: { display: '$1.00' },
      },
    ],
  } as unknown as ProductSelection;

  return {
    product: {
      id,
      title: `Product ${id}`,
      sku: null,
      base_price_money_object: { display: '$1.00' },
    } as unknown as ProductListItemWithVariants,
    selection,
  };
};

const items = [1, 2, 3].map(buildItem);
const noLocked = new Set<number>();

const buildLockedSelection = (lockedVariantIds: Set<number>) =>
  items.reduce((selection, item) => {
    const variants = item.selection.variants.filter((variant) =>
      lockedVariantIds.has(variant.variantId),
    );

    return variants.length > 0
      ? selection.set(item.selection.productId, { ...item.selection, variants })
      : selection;
  }, new Map<number, ProductSelection>());

type HarnessProps = {
  mode: SelectProductsMode;
  lockedVariantIds?: Set<number>;
};

const Harness = ({ mode, lockedVariantIds = noLocked }: HarnessProps) => {
  const [selectedProducts] = useState(() =>
    Array.from(buildLockedSelection(lockedVariantIds).values()),
  );

  return (
    <SelectProductsProvider
      mode={mode}
      selectedProducts={selectedProducts}
      pickerItems={items}
      isLoading={false}
      expandAll
    >
      <ProductTable />
    </SelectProductsProvider>
  );
};

const checkboxes = () => screen.getAllByRole('checkbox').slice(1);

const checkedStates = () =>
  checkboxes().map((checkbox) => checkbox.getAttribute('data-state') === 'checked');

const isDisabled = (checkbox: HTMLElement) => checkbox.hasAttribute('disabled');

describe('select products dialog table shift selection', () => {
  afterEach(cleanup);

  it('selects a range of product rows in product mode', () => {
    render(<Harness mode="product" />);

    fireEvent.click(checkboxes()[0]);
    fireEvent.click(checkboxes()[2], { shiftKey: true });

    expect(checkedStates()).toEqual([true, true, true]);
  });

  it('selects a range across expanded variant rows in order mode', () => {
    render(<Harness mode="order" />);

    // rows: P1, P1a, P1b, P2, P2a, P2b, P3, P3a, P3b
    fireEvent.click(checkboxes()[2]);
    fireEvent.click(checkboxes()[4], { shiftKey: true });

    expect(checkedStates()).toEqual([false, false, true, false, true, false, false, false, false]);
  });

  it('keeps a locked variant selected when a range deselects across it', () => {
    render(<Harness mode="order" lockedVariantIds={new Set([11])} />);

    fireEvent.click(checkboxes()[1]);
    fireEvent.click(checkboxes()[4]);
    fireEvent.click(checkboxes()[1], { shiftKey: true });

    expect(checkedStates()).toEqual([false, false, true, false, false, false, false, false, false]);
  });
});

describe('select products dialog table locked variants', () => {
  afterEach(cleanup);

  it('disables a locked variant, keeps it checked and shows the badge', () => {
    render(<Harness mode="order" lockedVariantIds={new Set([10])} />);

    expect(isDisabled(checkboxes()[1])).toBe(true);
    expect(isDisabled(checkboxes()[2])).toBe(false);

    fireEvent.click(screen.getByText('Variant 1a'));

    expect(checkedStates()[1]).toBe(true);
  });

  it('shows a product with every variant locked as disabled and unchecked', () => {
    render(<Harness mode="order" lockedVariantIds={new Set([20, 21])} />);

    expect(isDisabled(checkboxes()[3])).toBe(true);

    fireEvent.click(screen.getByText('Product 2'));

    expect(checkedStates()).toEqual([false, false, false, false, true, true, false, false, false]);
  });

  it('does not lock anything in product mode', () => {
    render(<Harness mode="product" />);
    expect(checkboxes().every((checkbox) => !isDisabled(checkbox))).toBe(true);
  });
});

describe('select products dialog table re-renders', () => {
  afterEach(cleanup);

  it('re-renders only the toggled row', () => {
    render(<Harness mode="product" />);
    priceTextRenders.count = 0;

    fireEvent.click(checkboxes()[0]);

    expect(checkedStates()).toEqual([true, false, false]);
    expect(priceTextRenders.count).toBe(1);
  });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import ProductTable from '@/features/products/components/shared/select-products-dialog/product-table';
import type { ProductSelection } from '@/features/products/components/shared/select-products-dialog/types';
import type { ProductListItemWithVariants } from '@/features/products/schemas/catalog/product';

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

const Harness = ({ selectVariants }: { selectVariants: boolean }) => {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set());

  const apply = (previous: Set<number>, ids: number[], checked: boolean) => {
    const next = new Set(previous);

    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));

    return next;
  };

  return (
    <ProductTable
      isLoading={false}
      pickerItems={items}
      selectVariants={selectVariants}
      allOnPageSelected={false}
      partialOnPageSelected={false}
      pageSelectableCount={items.length}
      onToggleAllOnPage={() => undefined}
      expandedProductIds={new Set(items.map((item) => item.product.id))}
      onToggleExpand={() => undefined}
      selectedProductIds={selectedProductIds}
      selectedVariantIds={selectedVariantIds}
      onToggleProduct={(product, checked) =>
        setSelectedProductIds((previous) => apply(previous, [product.productId], checked))
      }
      onToggleVariants={(_product, variants, checked) =>
        setSelectedVariantIds((previous) =>
          apply(
            previous,
            variants.map((variant) => variant.variantId),
            checked,
          ),
        )
      }
    />
  );
};

const checkboxes = () => screen.getAllByRole('checkbox').slice(1);

const checkedStates = () =>
  checkboxes().map((checkbox) => checkbox.getAttribute('data-state') === 'checked');

describe('select products dialog table shift selection', () => {
  afterEach(cleanup);

  it('selects a range of product rows in products mode', () => {
    render(<Harness selectVariants={false} />);

    fireEvent.click(checkboxes()[0]);
    fireEvent.click(checkboxes()[2], { shiftKey: true });

    expect(checkedStates()).toEqual([true, true, true]);
  });

  it('selects a range across expanded variant rows in variants mode', () => {
    render(<Harness selectVariants />);

    // rows: P1, P1a, P1b, P2, P2a, P2b, P3, P3a, P3b
    fireEvent.click(checkboxes()[2]);
    fireEvent.click(checkboxes()[4], { shiftKey: true });

    expect(checkedStates()).toEqual([
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
  });
});

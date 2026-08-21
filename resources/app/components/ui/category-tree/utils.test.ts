import { describe, expect, it } from 'vitest';

import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import { isPartiallySelected } from '@/components/ui/category-tree/utils';

const categories: CategoryTreeItem[] = [
  { id: 1, name: 'Clothing', parent_id: null },
  { id: 2, name: 'Men', parent_id: 1 },
  { id: 3, name: 'Women', parent_id: 1 },
  { id: 4, name: 'Shirts', parent_id: 2 },
  { id: 5, name: 'Trousers', parent_id: 2 },
  { id: 6, name: 'Books', parent_id: null },
];

describe('isPartiallySelected', () => {
  it('marks a parent partial when only some of its children are selected', () => {
    expect(isPartiallySelected(categories, 2, [4])).toBe(true);
  });

  it('marks an ancestor partial when the only selection is a grandchild', () => {
    expect(isPartiallySelected(categories, 1, [4])).toBe(true);
  });

  it('is not partial when the category itself is selected', () => {
    expect(isPartiallySelected(categories, 2, [2, 4, 5])).toBe(false);
  });

  it('is not partial when nothing in the subtree is selected', () => {
    expect(isPartiallySelected(categories, 1, [6])).toBe(false);
  });

  it('is not partial for a leaf category', () => {
    expect(isPartiallySelected(categories, 4, [5])).toBe(false);
  });
});

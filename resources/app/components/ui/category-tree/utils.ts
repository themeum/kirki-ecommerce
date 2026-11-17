import type { CategoryTreeItem } from '@/components/ui/category-tree/types';

const getAncestors = (categories: CategoryTreeItem[], category: CategoryTreeItem): CategoryTreeItem[] => {
  if (!category.parent_id) {
    return [];
  }

  const parent = categories.find((item) => item.id === category.parent_id);

  if (!parent) {
    return [];
  }

  return [parent, ...getAncestors(categories, parent)];
};

/**
 * Narrows the list to categories matching the query, keeping each match's
 * ancestors so the survivors still render as a connected tree.
 */
const filterCategoryTree = (categories: CategoryTreeItem[], query: string): CategoryTreeItem[] => {
  const search = query.trim().toLowerCase();

  if (!search) {
    return categories;
  }

  const keptIds = new Set<number>();

  categories.forEach((category) => {
    if (!category.name.toLowerCase().includes(search)) {
      return;
    }

    keptIds.add(category.id);
    getAncestors(categories, category).forEach((ancestor) => keptIds.add(ancestor.id));
  });

  return categories.filter((category) => keptIds.has(category.id));
};

export { filterCategoryTree, getAncestors };

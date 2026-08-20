import type { CategoryTreeItem } from '@/components/ui/category-tree/types';

const getDescendants = (categories: CategoryTreeItem[], parentId: number): CategoryTreeItem[] =>
  categories
    .filter((category) => category.parent_id === parentId)
    .flatMap((child) => [child, ...getDescendants(categories, child.id)]);

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

const isFullySelected = (
  categories: CategoryTreeItem[],
  categoryId: number,
  selectedIds: number[],
): boolean => {
  const children = categories.filter((category) => category.parent_id === categoryId);

  if (!children.length) {
    return selectedIds.includes(categoryId);
  }

  return children.every((child) => isFullySelected(categories, child.id, selectedIds));
};

const isPartiallySelected = (
  categories: CategoryTreeItem[],
  categoryId: number,
  selectedIds: number[],
): boolean => {
  if (selectedIds.includes(categoryId)) {
    return false;
  }

  return getDescendants(categories, categoryId).some((item) => selectedIds.includes(item.id));
};

const getAncestorsToSelect = (
  categories: CategoryTreeItem[],
  category: CategoryTreeItem,
  selectedIds: number[],
): CategoryTreeItem[] => {
  if (!category.parent_id) {
    return [];
  }

  const children = categories.filter((item) => item.parent_id === category.parent_id);
  const allChildrenSelected =
    children.length > 0 &&
    children.every((child) => isFullySelected(categories, child.id, selectedIds));

  if (!allChildrenSelected) {
    return [];
  }

  const parent = categories.find((item) => item.id === category.parent_id);

  if (!parent) {
    return [];
  }

  return [parent, ...getAncestorsToSelect(categories, parent, [...selectedIds, parent.id])];
};

/**
 * Checking a category selects all of its descendants, and cascades up to any
 * ancestor whose children are then fully selected. Unchecking removes the
 * category, its descendants, and all of its ancestors.
 */
const toggleCategorySelection = (
  categories: CategoryTreeItem[],
  selectedIds: number[],
  category: CategoryTreeItem,
  checked: boolean,
): number[] => {
  if (!checked) {
    const idsToRemove = new Set([
      category.id,
      ...getDescendants(categories, category.id).map((item) => item.id),
      ...getAncestors(categories, category).map((item) => item.id),
    ]);

    return selectedIds.filter((id) => !idsToRemove.has(id));
  }

  const nextIds = [
    ...selectedIds,
    ...[category, ...getDescendants(categories, category.id)]
      .map((item) => item.id)
      .filter((id) => !selectedIds.includes(id)),
  ];

  const ancestorIds = getAncestorsToSelect(categories, category, nextIds)
    .map((item) => item.id)
    .filter((id) => !nextIds.includes(id));

  return [...nextIds, ...ancestorIds];
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

export {
  filterCategoryTree,
  getAncestors,
  getDescendants,
  isFullySelected,
  isPartiallySelected,
  toggleCategorySelection,
};

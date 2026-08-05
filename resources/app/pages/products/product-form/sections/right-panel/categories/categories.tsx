import { useFormContext } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { useCategoriesQuery } from '@/services/category';
import { theme } from '@/theme';
import { itemCenter, scoped, defineStyles } from '@/theme/mixins';
import type { Category, ProductCategoryRef } from '@/types';
import { __ } from '@/wpi18n';

import AddNewCategory from '@/pages/products/product-form/sections/right-panel/categories/add-new-category';
import List from '@/pages/products/product-form/sections/right-panel/categories/list';

const Categories = () => {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const { data: categoryData, isSuccess: loaded } = useCategoriesQuery({
    limit: -1,
  });
  const categories = categoryData?.results ?? [];
  const selectedCategories: ProductCategoryRef[] = watch('categories') || [];

  const getParentsToDeselect = (
    category: Category,
    acc: Category[] = [],
  ): Category[] => {
    if (!category.parent_id) {
      return acc;
    }

    const parent = categories.find((item) => item.id === category.parent_id);
    if (!parent) {
      return acc;
    }

    acc.push(parent);
    return getParentsToDeselect(parent, acc);
  };

  const getAllDescendants = (
    parentId: number,
    all: Category[] = [],
  ): Category[] => {
    const children = categories.filter((item) => item.parent_id === parentId);

    for (const child of children) {
      all.push(child);
      getAllDescendants(child.id, all);
    }

    return all;
  };

  const isCategoryFullySelected = (
    categoryId: number,
    selectedIds: number[],
  ): boolean => {
    const children = categories.filter((c) => c.parent_id === categoryId);

    if (!children.length) {
      return selectedIds.includes(categoryId);
    }

    return children.every((child) =>
      isCategoryFullySelected(child.id, selectedIds),
    );
  };

  const areAllChildrenSelected = (
    parentId: number,
    selectedIds: number[],
  ): boolean => {
    const children = categories.filter((c) => c.parent_id === parentId);
    if (!children.length) {
      return false;
    }

    return children.every((child) =>
      isCategoryFullySelected(child.id, selectedIds),
    );
  };

  const getParentsToSelect = (
    category: Category,
    selectedIds: number[],
    acc: Category[] = [],
  ): Category[] => {
    if (!category.parent_id) {
      return acc;
    }

    if (areAllChildrenSelected(category.parent_id, selectedIds)) {
      const parent = categories.find(
        (item) => item.id === category.parent_id,
      );

      if (parent) {
        acc.push(parent);
        return getParentsToSelect(parent, selectedIds, acc);
      }
    }

    return acc;
  };

  const onSelectCategory = (value: boolean, category: Category) => {
    let newCategoryList = [...(selectedCategories || [])];

    if (!value) {
      const descendants = getAllDescendants(category.id);
      const parents = getParentsToDeselect(category);

      const idsToRemove = [
        category.id,
        ...descendants.map((c) => c.id),
        ...parents.map((p) => p.id),
      ];

      newCategoryList = newCategoryList.filter(
        (item) => !idsToRemove.includes(item.id),
      );
    } else {
      const descendants = getAllDescendants(category.id);
      const toAdd = [category, ...descendants];

      toAdd.forEach((item) => {
        if (!newCategoryList.some((c) => c.id === item.id)) {
          const { id, name, parent_id } = item;
          const level = (item as Category & { level?: number }).level;
          newCategoryList.push({ id, name, parent_id, level });
        }
      });

      const selectedIds = newCategoryList.map((c) => c.id);
      const parentsToAdd = getParentsToSelect(category, selectedIds);

      parentsToAdd.forEach((parent) => {
        if (!newCategoryList.some((c) => c.id === parent.id)) {
          const { id, name, parent_id } = parent;
          const level = (parent as Category & { level?: number }).level;
          newCategoryList.push({ id, name, parent_id, level });
        }
      });
    }

    setValue('categories', newCategoryList, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSelectAll = () => {
    if (selectedCategories.length < categories.length) {
      const allCategories = categories.map((item) => ({
        id: item?.id,
        name: item?.name,
        parent_id: item?.parent_id,
        level: (item as Category & { level?: number })?.level,
      }));
      setValue('categories', allCategories, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue('categories', [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <Card cssOverride={styles.card}>
      <div css={scoped(styles.header)}>
        <Label>{__('Categories', 'kirki-ecommerce')}</Label>
      </div>
      {!loaded && (
        <div css={scoped(styles.loading)}>{__('Loading...', 'kirki-ecommerce')}</div>
      )}
      {loaded && (
        <>
          {categories.length > 0 && (
            <div css={scoped(styles.list)}>
              <div css={scoped(styles.row)}>
                <Flex gap={2} align="center">
                  <Checkbox
                    id="categories-all-products"
                    checked={
                      selectedCategories.length < categories.length &&
                      selectedCategories.length !== 0
                        ? 'indeterminate'
                        : selectedCategories.length === categories.length
                    }
                    onCheckedChange={() => onSelectAll()}
                  />
                  <Label htmlFor="categories-all-products">
                    {__('All Products', 'kirki-ecommerce')}
                  </Label>
                </Flex>
              </div>
              <List
                categories={categories}
                parent_id={null}
                selectedCategories={selectedCategories}
                onSelectCategory={onSelectCategory}
              />
            </div>
          )}
          <div css={scoped(styles.footer)}>
            <AddNewCategory />
          </div>
        </>
      )}
    </Card>
  );
};

Categories.displayName = 'Categories';

export default Categories;

const styles = defineStyles({
  card: {
    padding: theme.spacing[0],
    rowGap: theme.spacing[0],
    overflow: 'hidden',
  },
  header: {
    padding: theme.spacing[4],
  },
  list: {
    width: '100%',
    maxHeight: '300px',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.colors.background.fillBrand} ${theme.colors.background.surfaceTertiary}`,
    '&::-webkit-scrollbar': {
      width: '4px',
      WebkitAppearance: 'none',
    },
    '&::-webkit-scrollbar-track': {
      background: theme.colors.background.fill,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.colors.background.fillBrand,
      borderRadius: theme.radius.sm,
    },
  },
  row: {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    ...itemCenter(),
  },
  footer: {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[4]} ${theme.spacing[4]}`,
  },
  loading: {
    padding: `0 ${theme.spacing[4]} ${theme.spacing[4]}`,
  },
});

import React from 'react';

import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Label from '@/molecules/label';
import { useProductForm } from '@/contexts/product-form-context';
import { useCategoriesQuery } from '@/services/category';
import type { Category, FormErrors, ProductCategoryRef } from '@/types';
import { __ } from '@/wpi18n';

import AddNewCategory from '@/pages/products/edit-product/right-panel/categories/add-new-category';
import List from '@/pages/products/edit-product/right-panel/categories/list';

type CategoriesProps = {
  errors?: FormErrors;
  setErrors?: React.Dispatch<React.SetStateAction<FormErrors>>;
};

const Categories = (_props: CategoriesProps) => {
  const { product: productData, updateProduct } = useProductForm();
  const { data: categoryData, isSuccess: loaded } = useCategoriesQuery({
    limit: -1,
  });
  const categories = categoryData?.results ?? [];
  const selectedCategories: ProductCategoryRef[] =
    productData?.categories || [];

  const getParentsToDeselect = (
    category: Category,
    acc: Category[] = [],
  ): Category[] => {
    if (!category.parent_id) {
      return acc;
    }

    const parent = categories.find(
      (item) => item.id === category.parent_id,
    );
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
    const children = categories.filter(
      (item) => item.parent_id === parentId,
    );

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
    const children = categories.filter(
      (c) => c.parent_id === categoryId,
    );

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
    const children = categories.filter(
      (c) => c.parent_id === parentId,
    );
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

    updateProduct({
      key: 'categories',
      value: newCategoryList,
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
      updateProduct({
        key: 'categories',
        value: allCategories,
      });
    } else {
      updateProduct({
        key: 'categories',
        value: null,
      });
    }
  };

  return (
    <Card type="form">
      <Label text={__('Categories', 'kirki-ecommerce')} />
      {!loaded && <div>{__('Loading...', 'kirki-ecommerce')}</div>}
      {loaded && (
        <>
          {categories.length > 0 && (
            <div>
              <Checkbox
                label={__('All Products', 'kirki-ecommerce')}
                isPartialChecked={
                  selectedCategories.length < categories.length &&
                  selectedCategories.length !== 0
                }
                value={
                  selectedCategories.length === categories.length
                }
                onChange={(_value) => onSelectAll()}
              />
              <List
                categories={categories}
                parent_id={null}
                selectedCategories={selectedCategories}
                onSelectCategory={onSelectCategory}
              />
            </div>
          )}
          <AddNewCategory />
        </>
      )}
    </Card>
  );
};

Categories.displayName = 'Categories';

export default Categories;

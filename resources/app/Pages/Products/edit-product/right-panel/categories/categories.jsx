import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Label from '@/molecules/label';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCategoriesAPI } from "../../../../../store/categoriesSlice";
import List from './list';
import { useGetListAPI } from "@/hooks";
import { updateProduct } from "../../../../../store/productSlice";
import AddNewCategory from './add-new-category';
import { __ } from "@/wpi18n";

const Categories = () => {
  const dispatch = useDispatch();
  const categories = useSelector((state) => state.categories?.data?.results);
  const loaded = useSelector((state) => state.categories?.loaded);
  const { data: productData } = useSelector((state) => state.product);
  const selectedCategories = productData?.categories || [];
  useGetListAPI({
    reducerName: "categories",
    apiCallBack: getCategoriesAPI,
    page: 1,
    search: "",
    sort_by: "id",
    sort_order: "asc",
    limit: -1,
  });

  const getParentsToDeselect = (category, acc = []) => {
    if (!category.parent_id) return acc;

    const parent = categories.find((item) => item.id === category.parent_id);
    if (!parent) return acc;

    acc.push(parent);
    return getParentsToDeselect(parent, acc);
  };

  const getAllDescendants = (parentId, all = []) => {
    const children = categories.filter((item) => item.parent_id === parentId);

    for (const child of children) {
      all.push(child);
      getAllDescendants(child.id, all);
    }

    return all;
  };

  const isCategoryFullySelected = (categoryId, selectedIds) => {
    const children = categories.filter((c) => c.parent_id === categoryId);

    if (!children.length) {
      return selectedIds.includes(categoryId);
    }

    return children.every((child) =>
      isCategoryFullySelected(child.id, selectedIds),
    );
  };

  const areAllChildrenSelected = (parentId, selectedIds) => {
    const children = categories.filter((c) => c.parent_id === parentId);
    if (!children.length) return false;

    return children.every((child) =>
      isCategoryFullySelected(child.id, selectedIds),
    );
  };

  const getParentsToSelect = (category, selectedIds, acc = []) => {
    if (!category.parent_id) return acc;

    if (areAllChildrenSelected(category.parent_id, selectedIds)) {
      const parent = categories.find((item) => item.id === category.parent_id);

      if (parent) {
        acc.push(parent);
        return getParentsToSelect(parent, selectedIds, acc);
      }
    }

    return acc;
  };

  const onSelectCategory = (value, category) => {
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
          const { id, name, parent_id, level } = item;
          newCategoryList.push({ id, name, parent_id, level });
        }
      });

      const selectedIds = newCategoryList.map((c) => c.id);
      const parentsToAdd = getParentsToSelect(category, selectedIds);

      parentsToAdd.forEach((parent) => {
        if (!newCategoryList.some((c) => c.id === parent.id)) {
          const { id, name, parent_id, level } = parent;
          newCategoryList.push({ id, name, parent_id, level });
        }
      });
    }

    dispatch(
      updateProduct({
        key: "categories",
        value: newCategoryList,
      }),
    );
  };

  const onSelectAll = () => {
    if (selectedCategories.length < categories.length) {
      const allCategories = categories.map((item) => ({
        id: item?.id,
        name: item?.name,
        parent_id: item?.parent_id,
        level: item?.level,
      }));
      dispatch(
        updateProduct({
          key: "categories",
          value: allCategories,
        }),
      );
    } else {
      dispatch(
        updateProduct({
          key: "categories",
          value: null,
        }),
      );
    }
  };

  return (
    <Card type="form">
      <Label text={__("Categories", "kirki-ecommerce")} />
      {!loaded && <div>{__("Loading...", "kirki-ecommerce")}</div>}
      {loaded && (
        <>
          {categories?.length > 0 && (
            <div>
              <Checkbox
                label={__("All Products", "kirki-ecommerce")}
                isPartialChecked={
                  selectedCategories.length < categories.length &&
                  selectedCategories.length !== 0
                }
                value={selectedCategories.length === categories.length}
                onChange={(value) => onSelectAll(value)}
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

export default Categories;

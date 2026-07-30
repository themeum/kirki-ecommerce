import type { CSSObject } from '@emotion/react';
import React from 'react';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { Category } from '@/types';

import SingleItem from '@/pages/products/edit-product/right-panel/categories/single-item';

type ProductCategorySelection = {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
};

type ListProps = {
  categories: Category[];
  parent_id: number | null;
  selectedCategories: ProductCategorySelection[];
  onSelectCategory: (value: boolean, category: Category) => void;
};

const List = ({
  categories,
  parent_id,
  selectedCategories,
  onSelectCategory,
}: ListProps) => {
  const data = categories.filter(
    (category) => category.parent_id === parent_id,
  );

  const handleParentCategorySelect = (value: boolean, category: Category) => {
    onSelectCategory(value, category);
  };

  return (
    <div>
      {data.map((category) => (
        <React.Fragment key={category.id}>
          <SingleItem
            category={category}
            selectedCategories={selectedCategories}
            onSelectCategory={(v) => handleParentCategorySelect(v, category)}
          />
          <div css={scoped(styles.nested)}>
            <List
              categories={categories}
              parent_id={category.id}
              selectedCategories={selectedCategories}
              onSelectCategory={onSelectCategory}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

List.displayName = 'List';

export default List;

const styles = {
  nested: ({
    paddingLeft: theme.spacing[4],
  } satisfies CSSObject),
};

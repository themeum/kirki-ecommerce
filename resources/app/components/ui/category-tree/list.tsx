import React from 'react';

import SingleItem from '@/components/ui/category-tree/single-item';
import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import { isPartiallySelected } from '@/components/ui/category-tree/utils';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type ListProps = {
  categories: CategoryTreeItem[];
  parent_id: number | null;
  selectedIds: number[];
  onSelectCategory: (value: boolean, category: CategoryTreeItem) => void;
};

const List = ({ categories, parent_id, selectedIds, onSelectCategory }: ListProps) => {
  const data = categories.filter(
    (category) => category.parent_id === parent_id,
  );

  return (
    <div>
      {data.map((category) => (
        <React.Fragment key={category.id}>
          <SingleItem
            category={category}
            checked={selectedIds.includes(category.id)}
            isPartialChecked={isPartiallySelected(categories, category.id, selectedIds)}
            onSelectCategory={(value) => onSelectCategory(value, category)}
          />
          <div css={scoped(styles.nested)}>
            <List
              categories={categories}
              parent_id={category.id}
              selectedIds={selectedIds}
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

const styles = defineStyles({
  nested: {
    paddingLeft: theme.spacing[4],
  },
});

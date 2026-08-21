import List from '@/components/ui/category-tree/list';
import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import { toggleCategorySelection } from '@/components/ui/category-tree/utils';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CategoryTreeProps = {
  categories: CategoryTreeItem[];
  value: number[];
  onChange: (ids: number[]) => void;
  selectAllLabel?: string;
  showSelectAll?: boolean;
};

const CategoryTree = ({
  categories,
  value,
  onChange,
  selectAllLabel = __('All Products', 'kirki-ecommerce'),
  showSelectAll = true,
}: CategoryTreeProps) => {
  const handleSelectAll = () => {
    if (value.length < categories.length) {
      onChange(categories.map((category) => category.id));
      return;
    }

    onChange([]);
  };

  return (
    <div css={scoped(styles.list)}>
      {showSelectAll && (
        <div css={scoped(styles.row)}>
          <Flex gap={2} align="center">
            <Checkbox
              id="categories-select-all"
              checked={
                value.length > 0 && value.length < categories.length
                  ? 'indeterminate'
                  : value.length === categories.length
              }
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="categories-select-all">{selectAllLabel}</Label>
          </Flex>
        </div>
      )}
      <List
        categories={categories}
        parent_id={null}
        selectedIds={value}
        onSelectCategory={(checked, category) => {
          onChange(toggleCategorySelection(categories, value, category, checked));
        }}
      />
    </div>
  );
};

CategoryTree.displayName = 'CategoryTree';

export default CategoryTree;

const styles = defineStyles({
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
});

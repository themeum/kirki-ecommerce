import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { itemCenter, scoped } from '@/theme/mixins';
import type { Category } from '@/types';

type ProductCategorySelection = {
  id: number;
  name: string;
  parent_id?: number | null;
  level?: number;
};

type SingleItemProps = {
  category: Category;
  selectedCategories: ProductCategorySelection[];
  onSelectCategory: (value: boolean) => void;
};

const SingleItem = ({
  category,
  selectedCategories,
  onSelectCategory,
}: SingleItemProps) => {
  const isChecked = selectedCategories.some((c) => c.id === category.id);

  return (
    <div css={styles.row}>
      <Flex gap={2} align="center">
        <Checkbox
          id={`category-${category.id}`}
          checked={isChecked}
          onCheckedChange={(checked) => onSelectCategory(checked === true)}
        />
        <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
      </Flex>
    </div>
  );
};

SingleItem.displayName = 'SingleItem';

export default SingleItem;

const styles = {
  row: scoped({
    width: '100%',
    boxSizing: 'border-box',
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    ...itemCenter(),
  }),
};

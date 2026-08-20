import type { CategoryTreeItem } from '@/components/ui/category-tree/types';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped } from '@/theme/mixins';

type SingleItemProps = {
  category: CategoryTreeItem;
  checked: boolean;
  isPartialChecked: boolean;
  onSelectCategory: (value: boolean) => void;
};

const SingleItem = ({ category, checked, isPartialChecked, onSelectCategory }: SingleItemProps) => {
  return (
    <div css={scoped(styles.row)}>
      <Flex gap={2} align="center">
        <Checkbox
          id={`category-${category.id}`}
          checked={checked}
          isPartialChecked={isPartialChecked}
          onCheckedChange={(next) => onSelectCategory(next === true)}
        />
        <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
      </Flex>
    </div>
  );
};

SingleItem.displayName = 'SingleItem';

export default SingleItem;

const styles = defineStyles({
  row: {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    ...itemCenter(),
  },
});

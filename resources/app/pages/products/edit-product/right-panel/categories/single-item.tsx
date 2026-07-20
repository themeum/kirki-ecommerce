import Checkbox from '@/components/ui/checkbox';
import Label from '@/components/ui/label';
import Flex from '@/molecules/flex';
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
    <div style={{ padding: '8px 16px 8px 0px' }}>
      <Flex gap={8} style={{ alignItems: 'center' }}>
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

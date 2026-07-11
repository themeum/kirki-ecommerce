import Checkbox from '@/molecules/checkbox';
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
  return (
    <div style={{ padding: '8px 16px 8px 0px' }}>
      <Checkbox
        label={category.name}
        value={selectedCategories.some((c) => c.id === category.id)}
        onChange={(value) => onSelectCategory(value)}
      />
    </div>
  );
};

export default SingleItem;

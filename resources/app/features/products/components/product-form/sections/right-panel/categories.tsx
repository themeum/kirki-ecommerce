import { CategoriesField } from '@/features/categories';
import { __ } from '@/wpi18n';

const Categories = () => (
  <CategoriesField name="categories" label={__('Categories', 'kirki-ecommerce')} />
);

Categories.displayName = 'Categories';

export default Categories;

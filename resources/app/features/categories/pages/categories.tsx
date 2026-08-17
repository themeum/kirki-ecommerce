import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import CategoryTable from '@/features/categories/components/category-table/category-table';
import NewCategory from '@/features/categories/components/new-category';
import { __ } from '@/wpi18n';

const Categories = () => {
  return (
    <>
      <PageHeading
        text={__('Categories', 'kirki-ecommerce')}
        actions={<NewCategory />}
      />
      <Container>
        <CategoryTable />
      </Container>
    </>
  );
};

Categories.displayName = 'Categories';

export default Categories;


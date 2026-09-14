import { Page, PageContent, PageHeading } from '@/components/ui/page';
import CategoryTable from '@/features/categories/components/category-table/category-table';
import NewCategory from '@/features/categories/components/new-category';
import { __ } from '@/wpi18n';

const Categories = () => {
  return (
    <Page>
      <PageHeading text={__('Categories', 'kirki-ecommerce')} actions={<NewCategory />} />
      <PageContent>
        <CategoryTable />
      </PageContent>
    </Page>
  );
};

Categories.displayName = 'Categories';

export default Categories;

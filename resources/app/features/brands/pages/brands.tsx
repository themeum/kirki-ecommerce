import { Page, PageContent, PageHeading } from '@/components/ui/page';
import BrandTable from '@/features/brands/components/brand-table/brand-table';
import NewBrand from '@/features/brands/components/new-brand';
import { __ } from '@/wpi18n';

const Brands = () => {
  return (
    <Page>
      <PageHeading text={__('Brands', 'kirki-ecommerce')} actions={<NewBrand />} />
      <PageContent>
        <BrandTable />
      </PageContent>
    </Page>
  );
};

Brands.displayName = 'Brands';

export default Brands;

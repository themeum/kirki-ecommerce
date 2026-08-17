import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import BrandTable from '@/features/brands/components/brand-table/brand-table';
import NewBrand from '@/features/brands/components/new-brand';
import { __ } from '@/wpi18n';

const Brands = () => {
  return (
    <>
      <PageHeading text={__('Brands', 'kirki-ecommerce')} actions={<NewBrand />} />
      <Container>
        <BrandTable />
      </Container>
    </>
  );
};

Brands.displayName = 'Brands';

export default Brands;


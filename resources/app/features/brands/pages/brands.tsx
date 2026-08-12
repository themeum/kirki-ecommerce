import Pagination from '@/components/pagination';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import BrandTable from '@/features/brands/components/brand-table/brand-table';
import NewBrand from '@/features/brands/components/new-brand';
import { useBrandsQuery } from '@/features/brands/services/brand';
import { useListParams } from '@/hooks/index';
import { cardStyles } from '@/theme/card-styles';
import type { PaginationData } from '@/types/components/common';
import { __ } from '@/wpi18n';

const Brands = () => {
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'name',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useBrandsQuery(params);

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

  return (
    <>
      <PageHeading text={__('Brands', 'kirki-ecommerce')} actions={<NewBrand />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={4}>
            <Card cssOverride={cardStyles.tableCard}>
              <CardContent cssOverride={cardStyles.tableContent}>
                <BrandTable data={data!} isFetching={isFetching} />
              </CardContent>
            </Card>
            <Pagination
              data={data as PaginationData}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>{__('Loading...', 'kirki-ecommerce')}</div>
        )}
      </Container>
    </>
  );
};

Brands.displayName = 'Brands';

export default Brands;


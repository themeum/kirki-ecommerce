import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import Button from '@/components/ui/button';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { useProductsQuery } from '@/services/product';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import ProductTable from '@/pages/products/product-table/product-table';

const Products = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams({
    defaults: {
      search: '',
      sort_by: 'title',
      sort_order: 'asc',
      page: 1,
      limit: 10,
    },
  });
  const { data, isLoading, isFetching } = useProductsQuery(params);

  const handlePaginationChange = (value: number) => {
    setParam('page', value);
  };

  const loaded = !isLoading && Boolean(data);

  return (
    <>
      <PageHeading
        text={__('Products', 'kirki-ecommerce')}
        actions={
          <>
            <Button variant="ghost" size="sm">
              {__('Import', 'kirki-ecommerce')}
            </Button>
            <Button variant="ghost" size="sm">
              {__('Export', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigate('/products/' + NEW_ITEM_ID);
              }}
            >
              {__('Add Product', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card css={styles.tableCard}>
              <CardContent css={styles.tableContent}>
                <ProductTable data={data!} isFetching={isFetching} />
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

Products.displayName = 'Products';

export default Products;

const styles = {
  tableCard: scoped({
    overflow: 'hidden',
    border: '1px solid #e6e6e6',
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
};

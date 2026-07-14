import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
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
            <Button text={__('Import', 'kirki-ecommerce')} type="ghost" size="small" />
            <Button text={__('Export', 'kirki-ecommerce')} type="ghost" size="small" />
            <Button
              text={__('Add Product', 'kirki-ecommerce')}
              type="primary"
              size="small"
              onClick={() => {
                navigate('/products/' + NEW_ITEM_ID);
              }}
            />
          </>
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <ProductTable data={data!} isFetching={isFetching} />
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

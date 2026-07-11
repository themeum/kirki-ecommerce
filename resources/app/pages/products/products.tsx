import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import { NEW_ITEM_ID } from '@/conf';
import { useGetListAPI } from '@/hooks';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getProductsAPI, setKeyValue } from '@/store/productsSlice';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import ProductTable from './product-table/product-table';

const Products = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loaded, data } = useAppSelector((state) => state.products);
  useGetListAPI({ reducerName: 'products', apiCallBack: getProductsAPI });
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };
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
              <ProductTable />
            </Card>
            <Pagination
              data={data as PaginationData}
              onChange={(page) => handlePaginationChange(page)}
            />
          </Flex>
        ) : (
          <div>Loading...</div>
        )}
      </Container>
    </>
  );
};

export default Products;

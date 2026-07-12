import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Pagination from '@/components/pagination';
import { useGetListAPI } from '@/hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getBrandsAPI, setKeyValue } from '@/store/brandsSlice';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import BrandTable from '@/pages/brands/brand-table/brand-table';
import NewBrand from '@/pages/brands/new-brand';

const Brands = () => {
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.brands);
  useGetListAPI({ reducerName: 'brands', apiCallBack: getBrandsAPI });
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };

  return (
    <>
      <PageHeading text={__('Brands', 'kirki-ecommerce')} actions={<NewBrand />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <BrandTable />
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

export default Brands;

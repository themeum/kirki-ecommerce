import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Pagination from '@/components/pagination';
import { useGetListAPI } from '@/hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getCategoriesAPI, setKeyValue } from '@/store/categoriesSlice';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CategoryTable from '@/pages/categories/category-table/category-table';
import NewCategory from '@/pages/categories/new-category';

const Categories = () => {
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.categories);
  useGetListAPI({ reducerName: 'categories', apiCallBack: getCategoriesAPI });
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };

  return (
    <>
      <PageHeading text={__('Categories', 'kirki-ecommerce')} actions={<NewCategory />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CategoryTable />
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

export default Categories;

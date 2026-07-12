import { useNavigate } from 'react-router';

import Pagination from '@/components/pagination';
import { NEW_ITEM_ID } from '@/conf';
import { useGetListAPI } from '@/hooks';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { getCollectionsAPI, setKeyValue } from '@/store/collectionsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import CollectionTable from '@/pages/collections/collection-table/collection-table';

const Collections = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.collections);
  useGetListAPI({ reducerName: 'collections', apiCallBack: getCollectionsAPI });
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };
  return (
    <>
      <PageHeading
        text={__('Collections', 'kirki-ecommerce')}
        actions={
          <Button
            type="primary"
            size="small"
            text={__('Add Collection', 'kirki-ecommerce')}
            onClick={() => {
              navigate('/collections/' + NEW_ITEM_ID);
            }}
          />
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <CollectionTable />
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

export default Collections;

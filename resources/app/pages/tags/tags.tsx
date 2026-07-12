import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import Pagination from '@/components/pagination';
import { useGetListAPI } from '@/hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getTagsAPI, setKeyValue } from '@/store/tagsSlice';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

import TagTable from '@/pages/tags/tag-table/tag-table';
import NewTag from '@/pages/tags/new-tag';

const Tags = () => {
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.tags);
  useGetListAPI({ reducerName: 'tags', apiCallBack: getTagsAPI });

  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };
  return (
    <>
      <PageHeading text={__('Tags', 'kirki-ecommerce')} actions={<NewTag />} />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <TagTable />
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

export default Tags;

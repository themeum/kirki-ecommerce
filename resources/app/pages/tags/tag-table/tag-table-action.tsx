import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setKeyValue } from '@/store/tagsSlice';

const TagTableAction = () => {
  const dispatch = useAppDispatch();
  const { search } = useAppSelector((state) => state.tags);
  const handleSearchChange = (value: string) => {
    dispatch(setKeyValue({ key: 'search', value: value }));
  };
  return (
    <Flex style={{ padding: '16px 12px' }}>
      <div style={{ width: '160px' }}>
        <Searchbox
          onChange={(value) => handleSearchChange(value as string)}
          value={search}
        />
      </div>
    </Flex>
  );
};

export default TagTableAction;

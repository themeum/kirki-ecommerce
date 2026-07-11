import Flex from '@/molecules/flex';
import Searchbox from '@/molecules/searchbox';
import { setKeyValue } from '@/store/brandsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const BrandTableAction = () => {
  const dispatch = useAppDispatch();
  const { search } = useAppSelector((state) => state.brands);
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

export default BrandTableAction;

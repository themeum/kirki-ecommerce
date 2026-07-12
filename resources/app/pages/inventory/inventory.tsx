import Pagination from '@/components/pagination';
import { useGetListAPI } from '@/hooks';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import { updateBulkVariantAPI } from '@/store/BulkEditSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getInventoryAPI, setKeyValue } from '@/store/inventorySlice';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import InventoryTable from './inventory-table/inventory-table';

const Inventory = () => {
  const dispatch = useAppDispatch();
  const { loaded, hasChanges, data } = useAppSelector((state) => state.inventory);
  useGetListAPI({ reducerName: 'inventory', apiCallBack: getInventoryAPI });
  const handlePaginationChange = (value: number) => {
    dispatch(setKeyValue({ key: 'page', value: value }));
  };

  const handleInventoryUpdate = async () => {
    const { results } = data!;
    const res = await updateBulkVariantAPI({
      variants: Object.values(results),
    });
    if (isApiSuccess(res)) {
      dispatch(setKeyValue({ key: 'hasChanges', value: false }));
    }
  };

  const discardInventoryUpdate = () => {
    dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
    dispatch(setKeyValue({ key: 'hasChanges', value: false }));
  };

  return (
    <>
      <PageHeading
        text={
          hasChanges
            ? __('Save changes?', 'kirki-ecommerce')
            : __('Inventory', 'kirki-ecommerce')
        }
        actions={
          hasChanges ? (
            <>
              <Button
                type="ghost"
                text={__('Discard', 'kirki-ecommerce')}
                size="small"
                onClick={discardInventoryUpdate}
              />
              <Button
                type="primary"
                text={__('Save', 'kirki-ecommerce')}
                size="small"
                onClick={handleInventoryUpdate}
              />
            </>
          ) : (
            <>
              <Button
                type="ghost"
                text={__('Import', 'kirki-ecommerce')}
                size="small"
              />
              <Button
                type="ghost"
                text={__('Export', 'kirki-ecommerce')}
                size="small"
              />
            </>
          )
        }
      />
      <Container>
        {loaded ? (
          <Flex direction="column" gap={16}>
            <Card type="table">
              <InventoryTable />
            </Card>
            <Pagination
              data={{
                current_page: data?.current_page ?? 1,
                last_page: data?.last_page ?? 1,
                from: data?.from ?? 0,
                total: data?.total ?? 0,
                has_more_pages: data?.has_more_pages ?? false,
              }}
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

export default Inventory;

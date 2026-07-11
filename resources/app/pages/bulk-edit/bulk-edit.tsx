import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import { LayoutIcon } from '@/icons';
import Badge from '@/molecules/badge';
import Button from '@/molecules/button';
import FullPageContainer from '@/molecules/full-page-container';
import PageHeading from '@/molecules/page-heading';
import {
  getVariantsListByIdAPI,
  setKeyValue,
  updateBulkVariantAPI,
} from '@/store/BulkEditSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { MediaRef } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import BulkEditTable from './bulk-edit-table/bulk-edit-table';
import { allTableHeaders } from './utils';

const BulkEdit = () => {
  const dispatch = useAppDispatch();
  const { loaded, data } = useAppSelector((state) => state.bulk);
  const [selectedFields, setSelectedFields] = useState(
    allTableHeaders.map((item) => item.value),
  );
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').map(Number);

  useEffect(() => {
    dispatch(
      getVariantsListByIdAPI(ids as number[], {
        search: '',
        sort_by: 'id',
        sort_order: 'asc',
        page: 1,
      }),
    );
  }, []);

  const handleProductBulkSave = async () => {
    if (loaded) {
      const { variants } = data!;
      const formattedData = variants.map((item) => ({
        ...item,
        media: Number((item.media as MediaRef | null)?.id),
      }));
      const result = await updateBulkVariantAPI({ variants: formattedData });
      if (isApiSuccess(result)) {
        console.log(result);
        dispatch(setKeyValue({ key: 'toggler', value: Date.now() }));
      }
    }
  };

  return (
    <>
      <PageHeading
        text={__('Bulk Edit', 'kirki-ecommerce')}
        style={{
          padding: '16px 12px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f3f3f7',
          columnGap: '8px',
        }}
        size="fullWidth"
        hasBack
        noMargin
        buttonProps={{
          type: 'outlined',
          size: 'small',
        }}
        actions={
          <>
            <DropdownButton
              buttonProps={{
                type: 'outlined',
                icon: <LayoutIcon />,
              }}
              options={allTableHeaders}
              value={selectedFields}
              hasLeftIcon
              checkboxField
              multiple
              dropdownStyle={{ minWidth: '288px' }}
              onOptionSelect={(value) =>
                setSelectedFields(value as string[])
              }
            />
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="secondary"
              onClick={() => window.history.back()}
              size="small"
            />
            <Button
              text={__('Save', 'kirki-ecommerce')}
              type="primary"
              onClick={handleProductBulkSave}
              size="small"
            />
          </>
        }
      >
        <Badge type="secondary" text={__('Unsaved Changes', 'kirki-ecommerce')} />
      </PageHeading>

      <FullPageContainer scrollable>
        {loaded ? (
          <BulkEditTable selectedFields={selectedFields} />
        ) : (
          <div>{__('Loading...', 'kirki-ecommerce')}</div>
        )}
      </FullPageContainer>
    </>
  );
};

export default BulkEdit;

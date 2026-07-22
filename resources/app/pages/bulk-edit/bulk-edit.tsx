import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import Button from '@/components/ui/button';
import { BulkEditFormProvider, useBulkEditForm } from '@/contexts/bulk-edit-form-context';
import { LayoutIcon } from '@/icons';
import Badge from '@/molecules/badge';
import FullPageContainer from '@/molecules/full-page-container';
import PageHeading from '@/molecules/page-heading';
import { useBulkVariantsQuery, useUpdateBulkVariantsMutation } from '@/services/bulk-edit';
import type { MediaRef } from '@/types';
import { __ } from '@/wpi18n';

import BulkEditTable from '@/pages/bulk-edit/bulk-edit-table/bulk-edit-table';
import { allTableHeaders } from '@/pages/bulk-edit/utils';

const BulkEditPage = () => {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') ?? [];
  const [selectedFields, setSelectedFields] = useState(
    allTableHeaders.map((item) => item.value),
  );

  const { data: bulkData, isLoading } = useBulkVariantsQuery(ids);
  const { setVariants, variants, loaded } = useBulkEditForm();
  const { mutate: updateBulkVariants } = useUpdateBulkVariantsMutation();

  useEffect(() => {
    if (bulkData) {
      setVariants(bulkData);
    }
  }, [bulkData]);

  const handleProductBulkSave = () => {
    if (!loaded) {
      return;
    }
    const formattedData = variants.map((item) => ({
      ...item,
      media: Number((item.media as MediaRef | null)?.id),
    }));
    updateBulkVariants({ variants: formattedData });
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
              variant="secondary"
              size="sm"
              onClick={() => window.history.back()}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleProductBulkSave}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
      >
        <Badge type="secondary" text={__('Unsaved Changes', 'kirki-ecommerce')} />
      </PageHeading>

      <FullPageContainer scrollable>
        {loaded && !isLoading ? (
          <BulkEditTable selectedFields={selectedFields} />
        ) : (
          <div>{__('Loading...', 'kirki-ecommerce')}</div>
        )}
      </FullPageContainer>
    </>
  );
};

BulkEditPage.displayName = 'BulkEditPage';

const BulkEdit = () => (
  <BulkEditFormProvider>
    <BulkEditPage />
  </BulkEditFormProvider>
);

BulkEdit.displayName = 'BulkEdit';

export default BulkEdit;

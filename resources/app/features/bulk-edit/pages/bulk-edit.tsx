import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import DropdownButton from '@/components/dropdown-button';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import FullPageContainer from '@/components/ui/full-page-container';
import PageHeading from '@/components/ui/page-heading';
import { BulkEditFormProvider, useBulkEditForm } from '@/features/bulk-edit';
import { allTableHeaders } from '@/features/bulk-edit/lib/utils';
import BulkEditTable from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table';
import { useBulkVariantsQuery, useUpdateBulkVariantsMutation } from '@/features/bulk-edit/services/bulk-edit';
import { LayoutIcon } from '@/icons';
import type { MediaRef } from '@/schemas/shared/media';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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
  }, [bulkData, setVariants]);

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
        cssOverride={styles.heading}
        size="fullWidth"
        hasBack
        noMargin
        buttonProps={{
          variant: 'outline',
          size: 'icon',
        }}
        backIcon={<ChevronLeft size={16} aria-hidden="true" />}
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
              onClick={() => window.history.back()}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={handleProductBulkSave}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
      >
        <Badge variant="secondary">
          {__('Unsaved Changes', 'kirki-ecommerce')}
        </Badge>
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

const styles = defineStyles({
  heading: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
    backgroundColor: theme.colors.background.surface,
    borderBottom: `1px solid ${theme.colors.background.surfaceTertiary}`,
    columnGap: theme.spacing[2],
  },
});

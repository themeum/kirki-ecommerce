import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';

import BulkActionHandler from '@/components/bulk-action-handler';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Text from '@/components/ui/text';
import type { Attribute, AttributeValue } from '@/features/products';
import { useBulkDeleteAttributeValuesMutation } from '@/features/products';
import SingleRow from '@/features/settings/essentials/pages/variation-library/variation-table/single-row';
import VariantTableAction from '@/features/settings/essentials/pages/variation-library/variation-table/variant-table-action';
import { getSearchedValue, setUnsavedDataStatus } from '@/features/settings/lib/utils';
import { useMarkList } from '@/hooks';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { ConfirmationVariant } from '@/types/components/common';
import type { TaxonomyTableHeader } from '@/types/pages/common';
import { __ } from '@/wpi18n';

type AttributeWithMeta = Attribute & { updated_at?: string };

type SettingsOutletContext = {
  confirmAction: (params: {
    action?: () => void;
    otherProps?: {
      variant?: ConfirmationVariant;
      force?: boolean;
      title?: string;
      subtitle?: string;
    };
  }) => void;
};

type VariationTableProps = {
  results?: AttributeValue[];
  tableHeaders: TaxonomyTableHeader[];
  selectedItem?: AttributeWithMeta;
  updateDataList: Dispatch<SetStateAction<AttributeValue[]>>;
};

const VariationTable = ({
  results = [],
  tableHeaders,
  selectedItem,
  updateDataList,
}: VariationTableProps) => {
  const { confirmAction } = useOutletContext<SettingsOutletContext>();
  const bulkDeleteMutation = useBulkDeleteAttributeValuesMutation();
  const {
    handleSelectAll,
    handleAllCheckboxClick,
    handleSingleCheckboxClick,
    isSelected,
    selectedItems,
    itemCount,
  } = useMarkList({ data: { results, total: results?.length } });
  const [searchValue, setSearchValue] = useState('');

  const filteredList = useMemo(() => {
    const keyword = searchValue?.trim();
    if (!keyword) {
      return results;
    }
    return getSearchedValue(keyword, results);
  }, [searchValue, results]);

  const handleApplyAction = (action: string) => {
    if (action === 'delete') {
      setUnsavedDataStatus(true);
      confirmAction({
        action: () => onBulkDelete(),
        otherProps: {
          variant: 'delete',
          force: true,
          title: __('Delete all variation?', 'kirki-ecommerce'),
          subtitle: __(
            'Are you sure you want to delete all values? This action cannot be undone.',
            'kirki-ecommerce',
          ),
        },
      });
    }
  };

  const onBulkDelete = () => {
    if (!selectedItem) {
      return;
    }
    bulkDeleteMutation.mutate({
      attribute_id: selectedItem.id,
      ids: selectedItems as number[],
    });
  };

  return (
    <>
      {selectedItems.length > 0 ? (
        <BulkActionHandler
          optionsArray={[{ value: 'delete', title: __('Delete', 'kirki-ecommerce') }]}
          itemCount={itemCount}
          onSelectAll={handleSelectAll}
          onApply={(action) => handleApplyAction(action as string)}
        />
      ) : (
        <VariantTableAction
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          dataList={filteredList}
          updateDataList={updateDataList}
        />
      )}
      {!filteredList?.length ? (
        <Card cssOverride={cardStyles.innerDarkCard}>
          <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyStateContent)}>
            <Flex align="center" justify="center">
              <Text weight="semibold" cssOverride={styles.mutedText}>{__('No data found', 'kirki-ecommerce')}</Text>
            </Flex>
          </CardContent>
        </Card>
      ) : (
        <Table fixed>
          <TableHeader>
            <TableRow>
              <TableHead onlyCheckbox>
                <Checkbox
                  checked={isSelected('*')}
                  onCheckedChange={handleAllCheckboxClick}
                />
              </TableHead>
              {tableHeaders?.map((header, index) => (
                <TableHead key={index}>{header?.title}</TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredList?.map((item, index) => {
              return (
                <SingleRow
                  key={index}
                  item={item}
                  selectedItem={selectedItem}
                  isSelected={isSelected}
                  handleSingleCheckboxClick={handleSingleCheckboxClick}
                />
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
};

VariationTable.displayName = 'VariationTable';

const styles = defineStyles({
  emptyStateContent: {
    padding: `${theme.spacing[9]} 0`,
    borderRadius: theme.radius.none,
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});

export default VariationTable;

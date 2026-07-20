import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useOutletContext } from 'react-router';

import BulkActionHandler from '@/components/bulk-action-handler';
import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { CLASS_PREFIX } from '@/conf';
import { useMarkList } from '@/hooks';
import Flex from '@/molecules/flex';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/molecules/table';
import Text from '@/molecules/text';
import { useBulkDeleteAttributeValuesMutation } from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  ConfirmationVariant,
  TaxonomyTableHeader,
} from '@/types';
import { __ } from '@/wpi18n';

import { getSearchedValue, setUnsavedDataStatus } from '@/pages/settings/utils';
import SingleRow from '@/pages/settings/essential-settings/variation-library/variation-table/single-row';
import VariantTableAction from '@/pages/settings/essential-settings/variation-library/variation-table/variant-table-action';

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
  } = useMarkList({ data: { results: results, total: results?.length } });
  const [searchValue, setSearchValue] = useState('');

  const filteredList = useMemo(() => {
    const keyword = searchValue?.trim();
    if (!keyword) {
      return results;
    }
    return getSearchedValue(keyword, results) as AttributeValue[];
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
    const attribute_id = selectedItem?.id as number;
    bulkDeleteMutation.mutate({
      attribute_id,
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
        <Card
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-innerDark`}
          style={{ padding: '36px 0', borderRadius: '0px' }}
        >
          <Flex style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Text
              type="primary"
              style={{ color: '#878593' }}
              header={__('No data found', 'kirki-ecommerce')}
            />
          </Flex>
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

export default VariationTable;

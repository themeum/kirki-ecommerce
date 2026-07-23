import { useState, useMemo, type Dispatch, type SetStateAction } from 'react';
import { useOutletContext } from 'react-router';

import BulkActionHandler from '@/components/bulk-action-handler';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { useMarkList } from '@/hooks';
import Flex from '@/components/ui/flex';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Text from '@/components/ui/text';
import { useBulkDeleteAttributeValuesMutation } from '@/services/attribute';
import type {
  Attribute,
  AttributeValue,
  ConfirmationVariant,
  TaxonomyTableHeader,
} from '@/types';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

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
        <Card css={styles.innerDarkCard}>
          <CardContent css={[styles.innerDarkContent, styles.emptyStateContent]}>
            <Flex style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text
                type="primary"
                style={{ color: '#878593' }}
                header={__('No data found', 'kirki-ecommerce')}
              />
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

const styles = {
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  largeCard: scoped({ gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({ padding: theme.spacing['3xl'] }),
  innerCard: scoped({ borderRadius: theme.radius.lg, boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({ padding: theme.spacing.lg }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  innerDarkContent: scoped({ padding: theme.spacing.lg }),
  emptyStateContent: scoped({
    padding: '36px 0',
    borderRadius: '0px',
  }),
  darkCard: scoped({ backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({ borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
};

export default VariationTable;

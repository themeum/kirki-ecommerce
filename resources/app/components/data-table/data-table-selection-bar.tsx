import type { CSSObject } from '@emotion/react';
import { useState } from 'react';

import type { DataTableSelectionState } from '@/components/data-table/types';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';
import type { SelectOption } from '@/types/components/common';
import { __, sprintf } from '@/wpi18n';

type DataTableSelectionBarProps = {
  selection: DataTableSelectionState;
  total: number;
  shownCount: number;
  bulkActionOptions?: SelectOption[];
  onBulkApply?: (action: string, selection: DataTableSelectionState) => void | Promise<void>;
  onSelectAllMatching: () => void;
  onClearSelection: () => void;
  cssOverride?: CSSObject;
};

const DataTableSelectionBar = (props: DataTableSelectionBarProps) => {
  const {
    selection,
    total,
    shownCount,
    bulkActionOptions,
    onBulkApply,
    onSelectAllMatching,
    onClearSelection,
    cssOverride,
  } = props;
  const { selectedCount, isAllMatchingSelected } = selection;
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleApply = async () => {
    if (!onBulkApply || !selectedAction) {
      return;
    }

    await onBulkApply(selectedAction, selection);
    onClearSelection();
  };

  return (
    <Flex gap={5} cssOverride={mergeCss(styles.wrapper, cssOverride)}>
      <Flex gap={3} align="center">
        <Text variant="small" color="subdued">
          {sprintf(__('%s selected', 'kirki-ecommerce'), selectedCount)}
        </Text>
        {total > shownCount && (
          <Button
            variant="link"
            onClick={isAllMatchingSelected ? onClearSelection : onSelectAllMatching}
          >
            {isAllMatchingSelected
              ? sprintf(__('Deselect all %s items', 'kirki-ecommerce'), total)
              : sprintf(__('Select all %s items', 'kirki-ecommerce'), total)}
          </Button>
        )}
      </Flex>
      {bulkActionOptions && (
        <Flex gap={2} align="center">
          <Select onValueChange={setSelectedAction}>
            <SelectTrigger cssOverride={styles.selectTrigger}>
              <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
            </SelectTrigger>
            <SelectContent>
              {bulkActionOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={handleApply} disabled={!selectedAction}>
            {__('Apply', 'kirki-ecommerce')}
          </Button>
        </Flex>
      )}
    </Flex>
  );
};

DataTableSelectionBar.displayName = 'DataTableSelectionBar';

export default DataTableSelectionBar;
export type { DataTableSelectionBarProps };

const styles = defineStyles({
  wrapper: {
    backgroundColor: theme.colors.background.fill,
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  },
  selectTrigger: {
    height: '2rem',
    minWidth: '100px',
  },
});

import type { CSSObject } from '@emotion/react';
import { useState } from 'react';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table/types';
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
import { __, sprintf } from '@/wpi18n';

type DataTableSelectionBarProps = {
  selection: DataTableSelectionState;
  total: number;
  shownCount: number;
  bulkActions?: DataTableBulkAction[];
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
    bulkActions,
    onBulkApply,
    onSelectAllMatching,
    onClearSelection,
    cssOverride,
  } = props;
  const { selectedCount, isAllMatchingSelected } = selection;
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const applyAction = async (action: string) => {
    if (!onBulkApply) {
      return;
    }

    setIsApplying(true);

    try {
      await onBulkApply(action, selection);
      onClearSelection();
    } catch {
      /*
       * The selection is kept so the action can be retried. Reporting is the
       * caller's job — its mutation has already surfaced the failure — but the
       * rejection is absorbed here so it does not escape unhandled.
       */
    } finally {
      setIsApplying(false);
    }
  };

  const handleApply = () => {
    if (!selectedAction) {
      return;
    }

    void applyAction(selectedAction);
  };

  const singleAction = bulkActions?.length === 1 ? bulkActions[0] : null;
  const hasActionChoice = !!bulkActions && bulkActions.length > 1;

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
      {singleAction && (
        <Button
          variant={singleAction.destructive ? 'destructive' : 'secondary'}
          loading={isApplying}
          onClick={() => void applyAction(singleAction.value)}
        >
          {singleAction.icon}
          {singleAction.title}
        </Button>
      )}
      {hasActionChoice && (
        <Flex gap={2} align="center">
          <Select onValueChange={setSelectedAction}>
            <SelectTrigger cssOverride={styles.selectTrigger}>
              <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
            </SelectTrigger>
            <SelectContent>
              {bulkActions.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            loading={isApplying}
            onClick={handleApply}
            disabled={!selectedAction}
          >
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

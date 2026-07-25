import { type SerializedStyles } from '@emotion/react';
import { useState, type CSSProperties, type ReactNode } from 'react';

import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { SelectOption } from '@/types';
import { __, sprintf } from '@/wpi18n';

type BulkActionHandlerProps = {
  itemCount: number;
  optionsArray?: SelectOption[];
  onSelectAll?: false | (() => void);
  onApply?: (action: string | number | null) => void;
  style?: CSSProperties;
  filterAction?: ReactNode;
  total?: number;
  per_page?: number;
  css?: SerializedStyles;
};

const BulkActionHandler = (props: BulkActionHandlerProps) => {
  const {
    itemCount,
    optionsArray,
    onSelectAll = false,
    onApply = () => {},
    style = {},
    filterAction,
    total,
    per_page,
    css: cssProp,
  } = props;
  const [selectAction, setSelectAction] = useState<string | number | null>(null);
  const handleActionChange = (nextValue: string) => {
    setSelectAction(nextValue);
  };

  return (
    <div
      css={[styles.wrapper, cssProp]}
      style={style}
    >
      <Flex gap={5}>
        <Flex gap={3} align="center">
          <Text variant="small" color="subdued">{`${itemCount} ${
              itemCount > 1 ? 'items' : 'item'
            } selected`}</Text>
          {onSelectAll && total !== undefined && per_page !== undefined && total > per_page && (
            <Button variant="link" onClick={onSelectAll}>
              {itemCount === total
                ? sprintf(__('Deselect All %d items', 'kirki-ecommerce'), total)
                : sprintf(__('Select All %d items', 'kirki-ecommerce'), total)}
            </Button>
          )}
        </Flex>
        {optionsArray && (
          <Flex gap={2} align="center">
            <Select onValueChange={handleActionChange}>
              <SelectTrigger style={{ minWidth: '100px' }}>
                <SelectValue placeholder={__('Select', 'kirki-ecommerce')} />
              </SelectTrigger>
              <SelectContent>
                {optionsArray.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={() => onApply(selectAction)}
              disabled={!selectAction}
            >
              {__('Apply', 'kirki-ecommerce')}
            </Button>
          </Flex>
        )}
        {filterAction && <ActionGroup>{filterAction}</ActionGroup>}
      </Flex>
    </div>
  );
};

export default BulkActionHandler;

const styles = {
  wrapper: scoped({
    backgroundColor: theme.colors.background.fill,
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
  }),
};

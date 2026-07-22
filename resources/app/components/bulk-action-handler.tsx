import { useState, type CSSProperties, type ReactNode } from 'react';

import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { SelectOption } from '@/types';
import { __, sprintf } from '@/wpi18n';

type BulkActionHandlerProps = {
  itemCount: number;
  optionsArray?: SelectOption[];
  onSelectAll?: false | (() => void);
  onApply?: (action: string | number | null) => void;
  className?: string;
  style?: CSSProperties;
  filterAction?: ReactNode;
  total?: number;
  per_page?: number;
};

const BulkActionHandler = (props: BulkActionHandlerProps) => {
  const {
    itemCount,
    optionsArray,
    onSelectAll = false,
    onApply = () => {},
    className = '',
    style = {},
    filterAction,
    total,
    per_page,
  } = props;
  const [selectAction, setSelectAction] = useState<string | number | null>(null);
  const handleActionChange = (nextValue: string) => {
    setSelectAction(nextValue);
  };

  return (
    <div
      className={`${CLASS_PREFIX}-bulk-action-bar ${className}`}
      style={style}
    >
      <Flex gap={20}>
        <Flex gap={10} style={{ alignItems: 'center' }}>
          <Text
            subHeader={`${itemCount} ${
              itemCount > 1 ? 'items' : 'item'
            } selected`}
            type="xsm"
          />
          {onSelectAll && total !== undefined && per_page !== undefined && total > per_page && (
            <Button variant="link" onClick={onSelectAll}>
              {itemCount === total
                ? sprintf(__('Deselect All %d items', 'kirki-ecommerce'), total)
                : sprintf(__('Select All %d items', 'kirki-ecommerce'), total)}
            </Button>
          )}
        </Flex>
        {optionsArray && (
          <Flex gap={8} style={{ alignItems: 'center' }}>
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
              size="sm"
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

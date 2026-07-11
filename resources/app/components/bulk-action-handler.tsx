import { useState, type CSSProperties, type ReactNode } from 'react';

import { CLASS_PREFIX } from '@/conf';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
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
  const handleActionChange = (actionName: string | number | Array<string | number>) => {
    if (Array.isArray(actionName)) {
      setSelectAction(actionName[0] ?? null);
      return;
    }
    setSelectAction(actionName);
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
            <Button
              type="blank"
              text={
                itemCount === total
                  ? sprintf(__('Deselect All %d items', 'kirki-ecommerce'), total)
                  : sprintf(__('Select All %d items', 'kirki-ecommerce'), total)
              }
              onClick={onSelectAll}
            />
          )}
        </Flex>
        {optionsArray && (
          <Flex gap={8} style={{ alignItems: 'center' }}>
            <Select
              optionsArray={optionsArray}
              onChange={handleActionChange}
              style={{ minWidth: '100px' }}
            />
            <Button
              text={__('Apply', 'kirki-ecommerce')}
              type="secondary"
              size="small"
              onClick={() => onApply(selectAction)}
              state={!selectAction ? 'disabled' : undefined}
            />
          </Flex>
        )}
        {filterAction && <ActionGroup>{filterAction}</ActionGroup>}
      </Flex>
    </div>
  );
};

export default BulkActionHandler;

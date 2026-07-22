import { useState, type ReactNode } from 'react';

import DropdownButton from '@/components/dropdown-button';
import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { EditPenIcon, TrashIcon, ShowMoreIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Badge from '@/molecules/badge';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

type GroupOptionItem = {
  name?: string;
  subText?: string;
  selected?: boolean;
  is_enabled?: boolean | string;
  rightIcon?: ReactNode;
  rightText?: string;
  badge1?: string;
  badge2?: string;
  icon?: ReactNode;
  is_default?: boolean;
  is_base?: boolean;
  is_toggle_disabled?: boolean;
  is_delete_disabled?: boolean;
  is_action_disabled?: boolean;
  actionsArray?: SelectOption[];
  [key: string]: unknown;
};

type GroupOptionCardProps = {
  dataArr?: GroupOptionItem[];
  handleToggleItem?: false | ((item: GroupOptionItem) => void);
  handleDeleteItem?: false | ((item: GroupOptionItem) => void);
  handleEditItem?: false | ((item: GroupOptionItem) => void);
  handleMoreOption?: false | boolean;
  actionsArray?: SelectOption[];
  handleAction?:
    | false
    | ((
        action: string | number | Array<string | number>,
        item: GroupOptionItem,
      ) => void);
};

const GroupOptionCard = (props: GroupOptionCardProps) => {
  const {
    dataArr = [],
    handleToggleItem = false,
    handleDeleteItem = false,
    handleEditItem = false,
    handleMoreOption = false,
    actionsArray = [],
    handleAction = false,
  } = props;
  let dataLength = 0;
  if (dataArr) {
    dataLength = dataArr?.length;
  }

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div>
      {dataArr.map((item, index) => (
        <Card
          type="inner"
          key={index}
          className={`${CLASS_PREFIX}-option-card ${CLASS_PREFIX}-hover-parent 
          ${
            activeIndex === index ? `${CLASS_PREFIX}-option-card-active` : ''
          } ${
            dataLength > 1
              ? `${CLASS_PREFIX}-option-card-border-radius`
              : `${CLASS_PREFIX}-option-card-border-radius-single`
          }`}
          style={{
            maxHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Flex
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Flex
              style={{
                alignItems: 'center',
                minHeight: '36px',
              }}
              gap={8}
            >
              <Text
                header={item?.name ?? ''}
                leftIcon={item?.icon}
                style={{ fontWeight: '500' }}
                type="xsm"
              />
              {item?.subText && (
                <Text
                  style={{ color: 'var(--decom-text-text-subdued)' }}
                  header={item?.subText ?? ''}
                  type="xsm"
                />
              )}
              {item?.badge1 && (
                <Badge
                  text={item.badge1}
                  type={item?.selected === true ? 'requested' : 'default'}
                />
              )}
              {item?.badge2 && <Badge text={item.badge2} type="default" />}
              {(item?.is_default || item?.is_base) && (
                <Badge
                  text={
                    item?.is_default
                      ? __('Default', 'kirki-ecommerce')
                      : __('Base currency', 'kirki-ecommerce')
                  }
                  type={'refunded'}
                />
              )}
              {item?.is_enabled === false ? (
                <Badge text={__('Inactive', 'kirki-ecommerce')} type="trashed" />
              ) : (
                ''
              )}
            </Flex>
            {(item?.rightIcon || item?.rightText) && (
              <Flex
                className={`${CLASS_PREFIX}-group-option-card-right-text`}
                gap={12}
              >
                {item.rightIcon && item.rightIcon}
                {item.rightText && (
                  <Text subHeader={item?.rightText} type="secondary" />
                )}
              </Flex>
            )}
            <ActionGroup className={`${CLASS_PREFIX}-card-actions`}>
              {handleToggleItem && !item?.is_toggle_disabled && (
                <ToggleButton
                  onChange={() => handleToggleItem(item)}
                  value={item?.is_enabled as boolean | undefined}
                />
              )}
              {handleDeleteItem && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={__('Delete', 'kirki-ecommerce')}
                  className={`${CLASS_PREFIX}-group-option-card-icon ${
                    item?.is_delete_disabled
                      ? `${CLASS_PREFIX}-icon-disabled`
                      : ''
                  }`}
                  onClick={
                    item?.is_delete_disabled
                      ? undefined
                      : () => handleDeleteItem(item)
                  }
                >
                  <TrashIcon />
                </Button>
              )}
              {handleEditItem && (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={__('Edit', 'kirki-ecommerce')}
                  onClick={() => handleEditItem(item)}
                  className={`${CLASS_PREFIX}-group-option-card-icon`}
                >
                  <EditPenIcon />
                </Button>
              )}
              {handleMoreOption && !item?.is_action_disabled && (
                <DropdownButton
                  buttonProps={{
                    type: 'secondary',
                    style: { transform: 'rotate(90deg)' },
                    icon: <ShowMoreIcon />,
                    className: `${CLASS_PREFIX}-group-option-card-icon `,
                  }}
                  dropdownStyle={{ minWidth: '170px' }}
                  size="small"
                  hasLeftIcon={false}
                  options={item?.actionsArray || actionsArray}
                  onOptionToggle={(value) => {
                    value === true
                      ? setActiveIndex(index)
                      : setActiveIndex(null);
                  }}
                  onOptionSelect={(action) => {
                    if (handleAction) {
                      handleAction(action, item);
                    }
                  }}
                />
              )}
            </ActionGroup>
          </Flex>
        </Card>
      ))}
    </div>
  );
};

export default GroupOptionCard;

import { css } from '@emotion/react';
import { useState, type ReactNode } from 'react';

import DropdownButton from '@/components/dropdown-button';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { EditPenIcon, ShowMoreIcon, TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
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

const cardActionsCss = css({
  display: 'none',
  pointerEvents: 'none',
  transition: 'opacity 0.15s ease',
});

const cardActionsActiveCss = css({
  display: 'flex',
  pointerEvents: 'auto',
});

const groupOptionCardRightTextCss = css({
  alignItems: 'center',
});

const groupOptionCardRightTextActiveCss = css({
  display: 'none',
});

const groupOptionCardIconCss = defineStyles({
  padding: theme.spacing[1],
});

const groupOptionCardIconDisabledCss = defineStyles({
  cursor: 'not-allowed',
  opacity: 0.5,
  pointerEvents: 'none',
});

const optionCardCss = defineStyles({
  borderRadius: theme.radius.none,
  borderTopColor: 'transparent',
});

const optionCardBorderRadiusCss = defineStyles({
  '&:first-of-type': {
    borderTopColor: theme.colors.border.secondary,
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} ${theme.radius.none} ${theme.radius.none}`,
  },
  '&:last-of-type': {
    borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.lg} ${theme.radius.lg}`,
  },
});

const optionCardBorderRadiusSingleCss = defineStyles({
  borderRadius: theme.radius.lg,
});

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

  const dataLength = dataArr.length ?? 0;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div>
      {dataArr.map((item, index) => (
        <Card
          key={index}
          data-box-card
          cssOverride={mergeCss(cardStyles.innerCard,
            optionCardCss,
            dataLength > 1
              ? optionCardBorderRadiusCss
              : optionCardBorderRadiusSingleCss)}
        >
          <CardContent cssOverride={cardStyles.innerContent}>
            <Flex align="center" justify="space-between" cssOverride={{ width: '100%' }}>
              <Flex gap={2} align="center" cssOverride={{ minHeight: '36px' }}>
                <Flex gap={2} align="center">
                  {item?.icon}
                  <Text variant="small" cssOverride={styles.mediumHeader}>{item?.name ?? ''}</Text>
                </Flex>
                {item?.subText && (
                  <Text variant="small" color="subdued">{item?.subText ?? ''}</Text>
                )}
                {item?.badge1 && (
                  <Badge
                    variant={item?.selected === true ? 'requested' : 'default'}
                  >
                    {item.badge1}
                  </Badge>
                )}
                {item?.badge2 && (
                  <Badge variant="default">{item.badge2}</Badge>
                )}
                {(item?.is_default || item?.is_base) && (
                  <Badge variant="secondary">
                    {item?.is_default
                      ? __('Default', 'kirki-ecommerce')
                      : __('Base currency', 'kirki-ecommerce')}
                  </Badge>
                )}
                {item?.is_enabled === false ? (
                  <Badge variant="destructive">
                    {__('Inactive', 'kirki-ecommerce')}
                  </Badge>
                ) : (
                  ''
                )}
              </Flex>
              {(item?.rightIcon || item?.rightText) && (
                <Flex
                  cssOverride={mergeCss(groupOptionCardRightTextCss,
                    activeIndex === index && groupOptionCardRightTextActiveCss,)}
                  gap={3}
                >
                  {item.rightIcon && item.rightIcon}
                  {item.rightText && (
                    <Text variant="small" color="secondary">{item?.rightText}</Text>
                  )}
                </Flex>
              )}
              <ActionGroup
                cssOverride={mergeCss(cardActionsCss,
                  activeIndex === index && cardActionsActiveCss,)}
              >
                {handleToggleItem && !item?.is_toggle_disabled && (
                  <Switch checked={Boolean(item?.is_enabled)} onCheckedChange={() => handleToggleItem(item)} />
                )}
                {handleDeleteItem && (
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label={__('Delete', 'kirki-ecommerce')}
                    cssOverride={
                      item?.is_delete_disabled
                        ? mergeCss(groupOptionCardIconCss, groupOptionCardIconDisabledCss)
                        : groupOptionCardIconCss
                    }
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
                    cssOverride={groupOptionCardIconCss}
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
                      cssOverride: groupOptionCardIconCss,
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GroupOptionCard;

const styles = defineStyles({
  mediumHeader: {
    ...theme.typography.paragraph('medium'),
  },
});


import { Package2 } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import DropdownButton from '@/components/dropdown-button';
import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
  useStackedItem,
} from '@/components/ui/stacked-items';
import Text from '@/components/ui/text';
import { EditPenIcon, ShowMoreIcon } from '@/icons';
import ShippingBoxPopup from '@/pages/settings/shipping-settings/shipping-box/shipping-box-dialog';
import { dispatchToastMessage } from '@/pages/utils';
import { useDeleteShippingBoxMutation, useShippingBoxesQuery, useUpdateShippingBoxMutation } from '@/services/shipping';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { ShippingBox as ShippingBoxType } from '@/types';
import { __, sprintf } from '@/wpi18n';

type BoxAction = {
  title: string;
  value: string;
};

type ShippingBoxListItem = ShippingBoxType & {
  is_default?: boolean;
  is_action_disabled?: boolean;
  actionsArray?: BoxAction[];
  icon?: ReactNode;
  subText?: string;
};

type ShippingBoxRowActionsProps = {
  item: ShippingBoxListItem;
  onEdit: (item: ShippingBoxListItem) => void;
  onAction: (action: string, item: ShippingBoxListItem) => void;
};

const ShippingBoxRowActions = (props: ShippingBoxRowActionsProps) => {
  const { item, onEdit, onAction } = props;
  const { setOpen } = useStackedItem();

  return (
    <ActionGroup>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={__('Edit', 'kirki-ecommerce')}
        cssOverride={styles.actionButton}
        onClick={() => onEdit(item)}
      >
        <EditPenIcon />
      </Button>
      {!item.is_action_disabled && (
        <DropdownButton
          buttonProps={{
            type: 'secondary',
            style: { transform: 'rotate(90deg)' },
            icon: <ShowMoreIcon />,
            cssOverride: styles.actionButton,
          }}
          dropdownStyle={{ minWidth: '170px' }}
          size="small"
          hasLeftIcon={false}
          options={item.actionsArray ?? []}
          onOptionToggle={(value) => setOpen(value === true)}
          onOptionSelect={(action) => onAction(String(action), item)}
        />
      )}
    </ActionGroup>
  );
};

const ShippingBox = () => {
  const [openPopup, setOpenPopup] = useState(false);
  const [shippingBoxList, setShippingBoxList] = useState<ShippingBoxListItem[]>([]);
  const [editedItem, setEditedItem] = useState<ShippingBoxListItem | null>(null);

  const { data: shippingBoxes = [], refetch } = useShippingBoxesQuery({ limit: -1 });
  const { mutate: updateBox } = useUpdateShippingBoxMutation();
  const { mutate: deleteBox } = useDeleteShippingBoxMutation();

  const getActionArray = (box: ShippingBoxListItem): BoxAction[] => {
    if (box.is_default) {
      return [];
    }
    return [
      {
        title: box.is_default
          ? __('Unset as Default', 'kirki-ecommerce')
          : __('Set as Default', 'kirki-ecommerce'),
        value: 'set_default',
      },
      {
        title: __('Delete', 'kirki-ecommerce'),
        value: 'delete',
      },
    ];
  };

  useEffect(() => {
    const updatedList = shippingBoxes.map((box) => ({
      ...box,
      subText: sprintf(
        __('%1$s x %2$s x %3$s %4$s', 'kirki-ecommerce'),
        box.length ?? 0,
        box.width ?? 0,
        box.height ?? 0,
        box.unit ?? '',
      ),
      is_action_disabled: (box as ShippingBoxListItem).is_default === true,
      actionsArray: getActionArray(box as ShippingBoxListItem),
    }));
    setShippingBoxList(updatedList as ShippingBoxListItem[]);
  }, [shippingBoxes]);

  const openCreatePopup = () => {
    setEditedItem(null);
    setOpenPopup(true);
  };

  const openEditPopup = (item: ShippingBoxListItem) => {
    setEditedItem(item);
    setOpenPopup(true);
  };

  const closePopup = () => {
    setOpenPopup(false);
    setEditedItem(null);
  };

  const handleAction = (action: string, item: ShippingBoxListItem) => {
    if (action === 'delete') {
      const initialList = [...shippingBoxList];
      setShippingBoxList((boxList) =>
        boxList.filter((box) => box?.id !== item?.id),
      );

      dispatchToastMessage('delete', {
        title: __('Shipping box deleted', 'kirki-ecommerce'),
        duration: 5000,
        undoAction: () => {
          setShippingBoxList(initialList);
        },
        onSuccess: () => {
          deleteBox(item?.id, {
            onSuccess: () => refetch(),
          });
        },
      });
    } else {
      const data = {
        ...item,
        is_default: !item?.is_default,
      };
      updateBox(
        { id: item?.id, data },
        {
          onSuccess: () => {
            dispatchToastMessage('success', {
              title: item?.is_default
                ? __('Shipping box unset as default', 'kirki-ecommerce')
                : __('Shipping box set as default', 'kirki-ecommerce'),
            });
            void refetch();
          },
        },
      );
    }
  };

  return (
    <>
      <Card cssOverride={cardStyles.formCard} >
        <CardContent>
          <HeaderActionsCard
            header={__('Shipping Box', 'kirki-ecommerce')}
            subHeader={__(
              'Configure box sizes for accurate shipping cost calculations.',
              'kirki-ecommerce',
            )}
            buttonText={__('Create Box', 'kirki-ecommerce')}
            onAdd={openCreatePopup}
          />
          {shippingBoxList.length > 0 && (
            <StackedItems cssOverride={{ marginTop: theme.spacing[5] }}>
              {shippingBoxList.map((item) => (
                <StackedItem key={item.id} id={String(item.id)}>
                  <StackedItemMedia>
                    <Package2 size={16} />
                  </StackedItemMedia>
                  <StackedItemContent>
                    <StackedItemTitle>
                      <Text variant="small" weight="medium">
                        {item.name ?? ''}
                      </Text>
                      {item.subText && (
                        <Text variant="tiny" color="subdued">
                          {item.subText}
                        </Text>
                      )}
                      {item.is_default && (
                        <Badge variant="secondary">
                          {__('Default', 'kirki-ecommerce')}
                        </Badge>
                      )}
                    </StackedItemTitle>
                  </StackedItemContent>
                  <StackedItemActions>
                    <ShippingBoxRowActions
                      item={item}
                      onEdit={openEditPopup}
                      onAction={handleAction}
                    />
                  </StackedItemActions>
                </StackedItem>
              ))}
            </StackedItems>
          )}
        </CardContent>
      </Card>
      {openPopup && (
        <ShippingBoxPopup
          isOpen={openPopup}
          onClose={closePopup}
          selectedItem={editedItem}
          onSave={() => refetch()}
        />
      )}
    </>
  );
};

ShippingBox.displayName = 'ShippingBox';

export default ShippingBox;

const styles = defineStyles({
  actionButton: {
    padding: theme.spacing[1],
  },
});

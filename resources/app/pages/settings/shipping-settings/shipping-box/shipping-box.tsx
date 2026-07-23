import { useEffect, useState, type ReactNode } from 'react';

import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { dispatchToastMessage } from '@/pages/utils';
import {
  useShippingBoxesQuery,
  useUpdateShippingBoxMutation,
  useDeleteShippingBoxMutation,
} from '@/services/shipping';
import type { ShippingBox as ShippingBoxType } from '@/types';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

import ShippingBoxPopup from '@/pages/settings/shipping-settings/shipping-box/shipping-box-dialog';

type BoxAction = {
  title: string;
  value: string;
};

type ShippingBoxListItem = ShippingBoxType & {
  is_default?: boolean;
  is_action_disabled?: boolean;
  actionsArray?: BoxAction[];
  icon?: ReactNode;
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
        onSuccess: async () => {
          deleteBox(item?.id as number, {
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
        { id: item?.id as number, data: data as Record<string, unknown> },
        {
          onSuccess: () => {
            dispatchToastMessage('success', {
              title: item?.is_default
                ? __('Shipping box unset as default', 'kirki-ecommerce')
                : __('Shipping box set as default', 'kirki-ecommerce'),
            });
            refetch();
          },
        },
      );
    }
  };

  return (
    <>
      <Card css={styles.largeCard} >
        <CardContent css={styles.largeContent}>

        <HeaderActionsCard
        header={__('Shipping Box', 'kirki-ecommerce')}
        subHeader={__(
        'Configure box sizes for accurate shipping cost calculations.',
        'kirki-ecommerce',
        )}
        buttonText={__('Create Box', 'kirki-ecommerce')}
        onAdd={openCreatePopup}
        />
        <GroupOptionCard
        dataArr={shippingBoxList}
        handleEditItem={(item) =>
        openEditPopup(item as ShippingBoxListItem)
        }
        handleMoreOption={true}
        actionsArray={[]}
        handleAction={(action, item) =>
        handleAction(String(action), item as ShippingBoxListItem)
        }
        />
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

export default ShippingBox;

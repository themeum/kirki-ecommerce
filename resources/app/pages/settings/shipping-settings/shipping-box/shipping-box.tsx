import { useEffect, useState, type ReactNode } from 'react';

import Card from '@/molecules/card';
import GroupOptionCard from '@/components/group-option-card';
import HeaderActionsCard from '@/components/header-actions-card';
import {
  deleteShippingBoxByIdAPI,
  getShippingBoxListAPI,
  updateShippingBoxAPI,
  setKeyValue,
} from '@/store/settingsSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetListAPI } from '@/hooks';
import { dispatchToastMessage } from '@/pages/utils';
import type { ShippingBox as ShippingBoxType } from '@/types';
import { isApiSuccess } from '@/types';
import { __ } from '@/wpi18n';

import ShippingBoxPopup from './shipping-box-popup';

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
  const dispatch = useAppDispatch();
  const [openPopup, setOpenPopup] = useState(false);
  const [shippingBoxList, setShippingBoxList] = useState<
    ShippingBoxListItem[]
  >([]);
  const [editedItem, setEditedItem] = useState<ShippingBoxListItem | null>(
    null,
  );
  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getShippingBoxListAPI,
    nestedToggler: ['shipping', 'shippingBox'],
    limit: -1,
  });
  const { data: shippingBox } = useAppSelector(
    (state) => state.settings?.shipping?.shippingBox,
  );

  useEffect(() => {
    fetchShippingBoxList();
  }, [shippingBox]);

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

  const fetchShippingBoxList = () => {
    const updatedList = shippingBox?.map((box) => ({
      ...box,
      is_action_disabled: box.is_default === true,
      actionsArray: getActionArray(box as ShippingBoxListItem),
    }));

    setShippingBoxList((updatedList as ShippingBoxListItem[]) ?? []);
  };

  useEffect(() => {
    if (shippingBox && shippingBox.length) {
      fetchShippingBoxList();
    }
  }, [shippingBox?.length]);

  const handleAction = async (action: string, item: ShippingBoxListItem) => {
    let result;
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
          result = await deleteShippingBoxByIdAPI(item?.id);
        },
      });
    } else {
      const data = {
        ...item,
        is_default: !item?.is_default,
      };
      result = await updateShippingBoxAPI(item?.id, data);
    }
    if (isApiSuccess(result)) {
      dispatch(
        setKeyValue({
          key: 'toggler',
          value: Date.now(),
          nestedToggler: ['shipping', 'shippingBox'],
        }),
      );
      dispatchToastMessage('success', {
        title: item?.is_default
          ? __('Shipping box unset as default', 'kirki-ecommerce')
          : __('Shipping box set as default', 'kirki-ecommerce'),
      });
    }
  };

  return (
    <>
      <Card type="large">
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
      </Card>
      {openPopup && (
        <ShippingBoxPopup
          isOpen={openPopup}
          onClose={closePopup}
          selectedItem={editedItem}
          fetchShippingBoxList={fetchShippingBoxList}
        />
      )}
    </>
  );
};

ShippingBox.displayName = 'ShippingBox';

export default ShippingBox;

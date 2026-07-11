import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { useGetListAPI } from '@/hooks';
import { PlusIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { useAppSelector } from '@/store/hooks';
import { getShippingBoxListAPI } from '@/store/settingsSlice';
import type { FormErrors, SelectOption, ShippingBox } from '@/types';
import { __ } from '@/wpi18n';

import ShippingBoxPopup from '../../../settings/shipping-settings/shipping-box/shipping-box-popup';

type ShippingBoxProps = {
  value?: number | string | null;
  errors?: FormErrors;
  onChange?: (id: unknown, fieldName: string) => void;
  invisible?: boolean;
};

const ShippingBoxSelect = ({
  value,
  errors,
  onChange = () => {},
  invisible,
}: ShippingBoxProps) => {
  const navigate = useNavigate();
  const { loaded: shippingBoxLoaded, data: shippingBox } = useAppSelector(
    (state) => state.settings?.shipping?.shippingBox,
  );
  const [openShippingBoxPopup, setOpenShippingBoxPopup] = useState(false);
  const [shippingBoxList, setShippingBoxList] = useState<SelectOption[]>([]);
  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getShippingBoxListAPI,
    nestedToggler: ['shipping', 'shippingBox'],
    limit: -1,
  });

  useEffect(() => {
    if (shippingBoxLoaded) {
      formatBoxList(shippingBox ?? []);
    }
  }, [shippingBox]);

  const formatBoxList = (boxList: ShippingBox[] = []) => {
    const allBoxList = boxList.map((item) => {
      return {
        value: item.id,
        title: `${item.name} - ${item.length} x ${item.width} x ${item.height} ${item.unit}`,
      };
    });
    setShippingBoxList(allBoxList);
  };

  const handleOnChange = (id: unknown) => {
    onChange(id, 'shipping_box_id');
  };

  const ShippingBoxPopupView = ShippingBoxPopup as (props: {
    isOpen: boolean;
    onSave: (value: unknown) => void;
    onClose: () => void;
  }) => ReactElement;

  return (
    <>
      <Select
        optionsArray={shippingBoxList}
        invisible={invisible}
        value={value as string | number | undefined}
        onChange={(changeValue) => handleOnChange(changeValue)}
        error={errors?.shipping_box_id as string | boolean | undefined}
        dropdownHeader={
          <>
            <Flex
              style={{
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                subHeader={__('Available shipping boxes', 'kirki-ecommerce')}
                type="primary"
              />

              <Button
                text={__('Manage', 'kirki-ecommerce')}
                type="blank"
                style={{ color: '#5641F3' }}
                onClick={() => navigate('/settings/shipping')}
              />
            </Flex>
          </>
        }
        dropdownFooter={
          <ActionGroup>
            <Button
              type="secondary"
              text={__('Add new shipping box', 'kirki-ecommerce')}
              size="small"
              leftIcon={<PlusIcon />}
              onClick={() => setOpenShippingBoxPopup(true)}
            />
          </ActionGroup>
        }
      />
      {openShippingBoxPopup && (
        <ShippingBoxPopupView
          isOpen={openShippingBoxPopup}
          onSave={(saveValue) => handleOnChange(saveValue)}
          onClose={() => setOpenShippingBoxPopup(false)}
        />
      )}
    </>
  );
};

ShippingBoxSelect.displayName = 'ShippingBox';

export default ShippingBoxSelect;

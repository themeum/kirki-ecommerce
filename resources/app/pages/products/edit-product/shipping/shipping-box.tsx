import { type ReactElement, useState } from 'react';
import { useNavigate } from 'react-router';

import { PlusIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import { useShippingBoxesQuery } from '@/services/shipping';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import ShippingBoxPopup from '@/pages/settings/shipping-settings/shipping-box/shipping-box-popup';

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
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });
  const [openShippingBoxPopup, setOpenShippingBoxPopup] = useState(false);

  const shippingBoxList = (shippingBoxes ?? []).map((item) => ({
    value: item.id,
    title: `${item.name} - ${item.length} x ${item.width} x ${item.height} ${item.unit}`,
  }));

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

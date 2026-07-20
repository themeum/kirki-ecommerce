import { type ReactElement, useState } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon } from '@/icons';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { useShippingBoxesQuery } from '@/services/shipping';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

import ShippingBoxPopup from '@/pages/settings/shipping-settings/shipping-box/shipping-box-dialog';

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
        value={value !== null && value !== undefined ? String(value) : ''}
        onValueChange={(next) => handleOnChange(next)}
      >
        <SelectTrigger
          error={Boolean(errors?.shipping_box_id)}
          style={{ visibility: invisible ? 'hidden' : 'visible' }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <Flex
            style={{
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
            }}
          >
            <Text
              subHeader={__('Available shipping boxes', 'kirki-ecommerce')}
              type="primary"
            />
            <Button
              variant="ghost"
              size="sm"
              style={{ color: '#5641F3' }}
              onClick={() => navigate('/settings/shipping')}
            >
              {__('Manage', 'kirki-ecommerce')}
            </Button>
          </Flex>
          <SelectSeparator />
          {shippingBoxList.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.title}
            </SelectItem>
          ))}
          <SelectSeparator />
          <ActionGroup style={{ padding: '8px 12px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpenShippingBoxPopup(true)}
            >
              <PlusIcon />
              {__('Add new shipping box', 'kirki-ecommerce')}
            </Button>
          </ActionGroup>
        </SelectContent>
      </Select>
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

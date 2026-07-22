import { type ReactElement, useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CLASS_PREFIX } from '@/conf';
import { PlusCircleIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { useProductForm } from '@/contexts/product-form-context';
import { useShippingProfilesQuery } from '@/services/shipping';
import type { FormErrors, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-dialog';

type ShippingProfileProps = {
  errors?: FormErrors;
  onChange?: (value: unknown, fieldName: string) => void;
};

const ADD_SHIPPING_PROFILE_VALUE = '__add_shipping_profile__';

const ShippingProfile = ({
  errors: _errors,
  onChange = () => {},
}: ShippingProfileProps) => {
  const { product: productData } = useProductForm();
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });
  const [shippingProfileList, setShippingProfileList] = useState<
    SelectOption[]
  >([]);
  const [openAddProfilePopup, setOpenAddProfilePopup] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (shippingProfiles) {
      const updatedData = (shippingProfiles ?? []).map((item) => ({
        value: item.id,
        title: item.name,
      }));
      setShippingProfileList(updatedData);
    }
  }, [shippingProfiles]);

  useEffect(() => {
    setShow(productData?.variants[0].shipping_profile_id ? true : false);
  }, [productData]);

  const handleOnViewProfileOptions = (value: unknown, fieldName: string) => {
    setShow(Boolean(value));
    onChange(null, fieldName);
  };

  const shippingProfileId = productData?.variants[0].shipping_profile_id as
    | string
    | number
    | undefined;

  const CreateProfilePopupView = CreateProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Card
      className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark`}
      style={{
        padding: '4px 8px 4px 12px',
        height: '44px',
      }}
    >
      <Grid style={{ alignItems: 'center' }}>
        <Flex gap={8} style={{ alignItems: 'center' }}>
          <Checkbox
            id="assign-shipping-profile"
            checked={show}
            onCheckedChange={(checked) =>
              handleOnViewProfileOptions(checked === true, 'shipping_profile_id')
            }
          />
          <Label
            htmlFor="assign-shipping-profile"
            helpText={__('Assign shipping profile', 'kirki-ecommerce')}
          >
            {__('Assign shipping profile', 'kirki-ecommerce')}
          </Label>
        </Flex>
        <Select
          value={
            shippingProfileId !== undefined && shippingProfileId !== null
              ? String(shippingProfileId)
              : ''
          }
          onValueChange={(value) => {
            if (value === ADD_SHIPPING_PROFILE_VALUE) {
              setOpenAddProfilePopup(true);
              return;
            }
            onChange(value, 'shipping_profile_id');
          }}
        >
          <SelectTrigger style={{ visibility: show ? 'visible' : 'hidden' }}>
            <SelectValue
              placeholder={__('Add Shipping Profile', 'kirki-ecommerce')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ADD_SHIPPING_PROFILE_VALUE}>
              <Flex gap={8} style={{ alignItems: 'center' }}>
                <PlusCircleIcon />
                {__('Add Shipping Profile', 'kirki-ecommerce')}
              </Flex>
            </SelectItem>
            {shippingProfileList.length > 0 && <SelectSeparator />}
            {shippingProfileList.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Grid>
      <CreateProfilePopupView
        isOpen={openAddProfilePopup}
        onClose={() => setOpenAddProfilePopup(false)}
        onSave={(value) => onChange(value, 'shipping_profile_id')}
      />
    </Card>
  );
};

ShippingProfile.displayName = 'ShippingProfile';

export default ShippingProfile;

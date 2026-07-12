import { type ReactElement, useEffect, useState } from 'react';

import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Grid from '@/molecules/grid';
import { Select } from '@/molecules/select';
import { useProductForm } from '@/contexts/product-form-context';
import { useShippingProfilesQuery } from '@/services/shipping';
import type { FormErrors, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-popup';

type ShippingProfileProps = {
  errors?: FormErrors;
  onChange?: (value: unknown, fieldName: string) => void;
};

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

  const CreateProfilePopupView = CreateProfilePopup as (props: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: unknown) => void;
  }) => ReactElement;

  return (
    <Card
      type="innerDark"
      style={{
        padding: '4px 8px 4px 12px',
        height: '44px',
      }}
    >
      <Grid style={{ alignItems: 'center' }}>
        <Checkbox
          value={show}
          label={__('Assign shipping profile', 'kirki-ecommerce')}
          helpText={__('Assign shipping profile', 'kirki-ecommerce')}
          onChange={(value) =>
            handleOnViewProfileOptions(value, 'shipping_profile_id')
          }
        />
        <Select
          optionsArray={shippingProfileList}
          btnText="Add Shhipping Profile"
          onNewItemAdd={() => setOpenAddProfilePopup(true)}
          style={{
            visibility: show ? 'visible' : 'hidden',
          }}
          value={
            productData?.variants[0].shipping_profile_id as
              | string
              | number
              | undefined
          }
          onChange={(value) => onChange(value, 'shipping_profile_id')}
        />
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

import { useEffect, useState, type ReactElement } from 'react';

import { useGetListAPI } from '@/hooks';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Grid from '@/molecules/grid';
import { Select } from '@/molecules/select';
import { useAppSelector } from '@/store/hooks';
import { getShippingProfileList } from '@/store/settingsSlice';
import type { FormErrors, SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '../../../settings/shipping-settings/shipping-profile/create-profile-popup';

type ShippingProfileProps = {
  errors?: FormErrors;
  onChange?: (value: unknown, fieldName: string) => void;
};

const ShippingProfile = ({
  errors: _errors,
  onChange = () => {},
}: ShippingProfileProps) => {
  const { data: productData } = useAppSelector((state) => state.product);
  useGetListAPI({
    reducerName: 'settings',
    apiCallBack: getShippingProfileList,
    nestedToggler: ['shipping', 'shippingProfile'],
  });

  const [shippingProfileList, setShippingProfileList] = useState<
    SelectOption[]
  >([]);
  const [openAddProfilePopup, setOpenAddProfilePopup] = useState(false);
  const [show, setShow] = useState(false);

  const { loaded, data: shippingProfile } = useAppSelector(
    (state) => state.settings?.shipping?.shippingProfile,
  );

  useEffect(() => {
    if (loaded) {
      formatProfileList();
    }
  }, [shippingProfile]);

  useEffect(() => {
    setShow(productData?.variants[0].shipping_profile_id ? true : false);
  }, [productData]);

  const formatProfileList = () => {
    const updatedData = (shippingProfile ?? []).map((item) => ({
      value: item.id,
      title: item.name,
    }));

    setShippingProfileList(updatedData);
  };

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

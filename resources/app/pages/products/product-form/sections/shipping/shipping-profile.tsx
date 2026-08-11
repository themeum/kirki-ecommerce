import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircleIcon } from '@/icons';
import type { ProductFormInput } from '@/schemas/forms/product-form';
import { useShippingProfilesQuery } from '@/services/shipping';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { SelectOption } from '@/types';
import { __ } from '@/wpi18n';

import { CreateProfilePopup } from '@/pages/settings/shipping-settings/shipping-profile/create-profile-dialog';

const ADD_SHIPPING_PROFILE_VALUE = '__add_shipping_profile__';

const ShippingProfile = () => {
  const { setValue, control } = useFormContext<ProductFormInput>();
  const shippingProfileId = useWatch({
    control,
    name: 'variants.0.shipping_profile_id',
  });
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });
  const [shippingProfileList, setShippingProfileList] = useState<
    SelectOption[]
  >([]);
  const [openAddProfilePopup, setOpenAddProfilePopup] = useState(false);
  const [show, setShow] = useState(Boolean(shippingProfileId));

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
    setShow(Boolean(shippingProfileId));
  }, [shippingProfileId]);

  const handleToggle = (checked: boolean) => {
    setShow(checked);
    if (!checked) {
      setValue('variants.0.shipping_profile_id', null, { shouldDirty: true });
    }
  };

  return (
    <Card cssOverride={cardStyles.innerDarkCard}>
      <CardContent cssOverride={styles.innerDarkRowContent}>
        <Grid align="center">
          <Field orientation="horizontal">
            <Checkbox
              id="assign-shipping-profile"
              checked={show}
              onCheckedChange={(checked) => handleToggle(checked === true)}
            />
            <FieldLabel htmlFor="assign-shipping-profile">
              {__('Assign shipping profile', 'kirki-ecommerce')}
            </FieldLabel>
          </Field>
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
              setValue('variants.0.shipping_profile_id', value, {
                shouldDirty: true,
              });
            }}
          >
            <SelectTrigger style={{ visibility: show ? 'visible' : 'hidden' }}>
              <SelectValue
                placeholder={__('Add Shipping Profile', 'kirki-ecommerce')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADD_SHIPPING_PROFILE_VALUE}>
                <Flex gap={2} align="center">
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
      </CardContent>
      <CreateProfilePopup
        isOpen={openAddProfilePopup}
        onClose={() => setOpenAddProfilePopup(false)}
        onSave={(id) =>
          setValue('variants.0.shipping_profile_id', id, {
            shouldDirty: true,
          })
        }
      />
    </Card>
  );
};

ShippingProfile.displayName = 'ShippingProfile';

export default ShippingProfile;

const styles = defineStyles({
  innerDarkRowContent: {
    padding: `${theme.spacing[1]} ${theme.spacing[2]} ${theme.spacing[1]} ${theme.spacing[3]}`,
    height: '44px',
  },
});

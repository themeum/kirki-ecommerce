import { useFormContext, useWatch } from 'react-hook-form';

import CheckboxField from '@/components/form/checkbox-field';
import CountryField from '@/components/form/country-field';
import RadioGroupField from '@/components/form/radio-group-field';
import StateField from '@/components/form/state-field';
import TextField from '@/components/form/text-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import type { CustomerFormInput } from '@/features/customers/schemas/forms/customer-form';
import { TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const ADDRESS_TYPE_OPTIONS = [
  { label: __('Home', 'kirki-ecommerce'), value: 'home' },
  { label: __('Office', 'kirki-ecommerce'), value: 'office' },
  { label: __('Other', 'kirki-ecommerce'), value: 'others' },
];

type AddressCardItemProps = {
  index: number;
  onRemove: () => void;
  onExclusiveDefault: (field: 'is_default_shipping' | 'is_default_billing') => void;
};

const AddressCardItem = ({ index, onRemove, onExclusiveDefault }: AddressCardItemProps) => {
  const { control } = useFormContext<CustomerFormInput>();
  const type = useWatch({ control, name: `addresses.${index}.type` });
  const country = useWatch({ control, name: `addresses.${index}.country` });

  return (
    <Card>
      <CardContent>
        <Flex justify="flex-end">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={__('Remove address', 'kirki-ecommerce')}
            onClick={onRemove}
          >
            <TrashIcon />
          </Button>
        </Flex>
        <Flex direction="column" gap={4}>
          <RadioGroupField
            name={`addresses.${index}.type`}
            label={__('Address type', 'kirki-ecommerce')}
            options={ADDRESS_TYPE_OPTIONS}
          />
          {type === 'others' && (
            <TextField
              name={`addresses.${index}.label`}
              placeholder={__('eg. john’s house', 'kirki-ecommerce')}
            />
          )}
          <CountryField
            name={`addresses.${index}.country`}
            label={__('Country/region', 'kirki-ecommerce')}
          />
          <Grid>
            <TextField
              name={`addresses.${index}.first_name`}
              label={__('First name', 'kirki-ecommerce')}
              placeholder={__('e.g. John', 'kirki-ecommerce')}
            />
            <TextField
              name={`addresses.${index}.last_name`}
              label={__('Last name', 'kirki-ecommerce')}
              placeholder={__('e.g. Musk', 'kirki-ecommerce')}
            />
          </Grid>
          <TextField
            name={`addresses.${index}.address_line1`}
            label={__('Address', 'kirki-ecommerce')}
            placeholder={__('e.g. 124 main st', 'kirki-ecommerce')}
          />
          <TextField
            name={`addresses.${index}.address_line2`}
            label={
              <Flex gap={1}>
                <span>{__('Apartment, suite, etc.', 'kirki-ecommerce')}</span>
                <span css={scoped(styles.optionalText)}>{__('(optional)', 'kirki-ecommerce')}</span>
              </Flex>
            }
          />
          <Grid columns={3}>
            <TextField name={`addresses.${index}.city`} label={__('City', 'kirki-ecommerce')} />
            <StateField
              country={country}
              name={`addresses.${index}.state`}
              label={__('State', 'kirki-ecommerce')}
            />
            <TextField
              name={`addresses.${index}.postal_code`}
              label={__('Zip code', 'kirki-ecommerce')}
            />
          </Grid>
          <Grid>
            <TextField
              name={`addresses.${index}.email`}
              label={__('Email', 'kirki-ecommerce')}
              type="email"
              placeholder={__('example@yourmail.com', 'kirki-ecommerce')}
            />
            <TextField
              name={`addresses.${index}.phone`}
              label={__('Phone', 'kirki-ecommerce')}
              type="tel"
              placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
            />
          </Grid>
          <Flex direction="column" gap={2}>
            <CheckboxField
              name={`addresses.${index}.is_default_shipping`}
              label={__('Set as default shipping address', 'kirki-ecommerce')}
              onCheckedChange={(checked) => {
                if (checked) {
                  onExclusiveDefault('is_default_shipping');
                }
              }}
            />
            <CheckboxField
              name={`addresses.${index}.is_default_billing`}
              label={__('Set as default billing address', 'kirki-ecommerce')}
              onCheckedChange={(checked) => {
                if (checked) {
                  onExclusiveDefault('is_default_billing');
                }
              }}
            />
          </Flex>
        </Flex>
      </CardContent>
    </Card>
  );
};

AddressCardItem.displayName = 'AddressCardItem';

export default AddressCardItem;

const styles = defineStyles({
  optionalText: {
    color: theme.colors.text.subdued,
  },
});

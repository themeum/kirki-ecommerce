import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import AddressCardItem from '@/features/customers/pages/customer-details/address-card-item';
import type {
  AddressFormValues,
  CustomerFormInput,
} from '@/features/customers/schemas/forms/customer-form';
import { PlusIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const NEW_ADDRESS: AddressFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  is_default_shipping: false,
  is_default_billing: false,
  type: 'home',
  label: '',
};

const CustomerAddressCard = () => {
  const { control } = useFormContext<CustomerFormInput>();
  const { fields, append, remove, update } = useFieldArray({ control, name: 'addresses' });
  const addresses = (useWatch({ control, name: 'addresses' }) ?? []) as AddressFormValues[];

  const handleExclusiveDefault = (
    index: number,
    field: 'is_default_shipping' | 'is_default_billing',
  ) => {
    fields.forEach((_, otherIndex) => {
      if (otherIndex === index || !addresses[otherIndex]?.[field]) {
        return;
      }

      update(otherIndex, { ...addresses[otherIndex], [field]: false });
    });
  };

  return (
    <Flex direction="column" gap={4}>
      {fields.map((field, index) => (
        <AddressCardItem
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
          onExclusiveDefault={(exclusiveField) => handleExclusiveDefault(index, exclusiveField)}
        />
      ))}
      <Flex justify="start">
        <Button
          variant="link"
          onClick={() => append(NEW_ADDRESS)}
          cssOverride={styles.addNewAddressButton}
        >
          <PlusIcon width={16} height={16} />
          <Text variant="small" weight="medium" color="emphasis">
            {__('Add new address', 'kirki-ecommerce')}
          </Text>
        </Button>
      </Flex>
    </Flex>
  );
};

CustomerAddressCard.displayName = 'CustomerAddressCard';

export default CustomerAddressCard;

const styles = defineStyles({
  addNewAddressButton: {
    color: theme.colors.text.emphasis,
  },
});

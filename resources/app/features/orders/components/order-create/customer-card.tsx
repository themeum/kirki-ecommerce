import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { useCustomerQuery } from '@/features/customers';
import AddCustomerDialog from '@/features/orders/components/order-create/customer/add-customer-dialog';
import AddressDialog from '@/features/orders/components/order-create/customer/address-dialog';
import ContactInfoDialog from '@/features/orders/components/order-create/customer/customer-info-dialog';
import CustomerSearchDropdown from '@/features/orders/components/order-create/customer/customer-search-dropdown';
import CustomerSummary from '@/features/orders/components/order-create/customer/customer-summary';
import {
  formatBillingAddress,
  formatShippingAddress,
  toOrderAddresses,
} from '@/features/orders/lib/customer-address';
import type { OrderFormInput } from '@/features/orders/schemas/forms/order-form';
import { OrderFormSchema } from '@/features/orders/schemas/forms/order-form';
import { ShowMoreIcon } from '@/icons';
import { getDefaults } from '@/libs/zod';
import { useCountriesQuery } from '@/services/country';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type CustomerCardProps = {
  onSave?: () => void;
  isSaving?: boolean;
  readonly?: boolean;
};

const WATCHED_ADDRESS_FIELDS = [
  'customer_first_name',
  'customer_last_name',
  'customer_email',
  'customer_phone',
  'shipping_address_line1',
  'shipping_address_line2',
  'shipping_city',
  'shipping_state',
  'shipping_postal_code',
  'shipping_country',
  'is_billing_same_as_shipping',
  'billing_address_line1',
  'billing_address_line2',
  'billing_city',
  'billing_state',
  'billing_postal_code',
  'billing_country',
] as const satisfies readonly (keyof OrderFormInput)[];

const CONTACT_ERROR_FIELDS = [
  'customer_first_name',
  'customer_last_name',
] as const satisfies readonly (keyof OrderFormInput)[];

const SHIPPING_ERROR_FIELDS = [
  'shipping_first_name',
  'shipping_last_name',
  'shipping_address_line1',
  'shipping_city',
  'shipping_state',
  'shipping_postal_code',
  'shipping_country',
] as const satisfies readonly (keyof OrderFormInput)[];

const BILLING_ERROR_FIELDS = [
  'billing_first_name',
  'billing_last_name',
  'billing_address_line1',
  'billing_city',
  'billing_state',
  'billing_postal_code',
  'billing_country',
] as const satisfies readonly (keyof OrderFormInput)[];

const CustomerCard = ({ onSave, isSaving, readonly = false }: CustomerCardProps) => {
  const form = useFormContext<OrderFormInput>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [dialogPrefill, setDialogPrefill] = useState('');
  const snapshot = useRef(form.getValues());
  const shouldApplyCustomerAddress = useRef(false);

  const customerId = useWatch({ control: form.control, name: 'customer_id' });
  const { data: customer } = useCustomerQuery(Number(customerId ?? 0), Boolean(customerId));
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const errors = form.formState.errors;
  const customerError = errors.customer_id;
  const hasContactError = CONTACT_ERROR_FIELDS.some((field) => Boolean(errors[field]));
  const hasShippingError = SHIPPING_ERROR_FIELDS.some((field) => Boolean(errors[field]));
  const hasBillingError = BILLING_ERROR_FIELDS.some((field) => Boolean(errors[field]));
  const hasError =
    Boolean(customerError) || Boolean(hasContactError) || hasShippingError || hasBillingError;

  useEffect(() => {
    if (!customer || !shouldApplyCustomerAddress.current) {
      return;
    }

    shouldApplyCustomerAddress.current = false;
    form.reset({ ...form.getValues(), ...toOrderAddresses(customer) });
  }, [customer, form]);

  const handleSelectCustomer = (id: number) => {
    shouldApplyCustomerAddress.current = true;
    form.setValue('customer_id', id, { shouldValidate: true });
  };

  const handleRemove = () => {
    snapshot.current = form.getValues();
    const defaults = getDefaults(OrderFormSchema);
    const defaultAddresses = Object.fromEntries(
      WATCHED_ADDRESS_FIELDS.map((field) => [field, defaults[field]]),
    );
    form.reset({ ...form.getValues(), ...defaultAddresses, customer_id: null });
  };

  const [
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    is_billing_same_as_shipping,
    billing_address_line1,
    billing_address_line2,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
  ] = useWatch({ control: form.control, name: WATCHED_ADDRESS_FIELDS });

  const values = {
    customer_first_name,
    customer_last_name,
    customer_email,
    customer_phone,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    is_billing_same_as_shipping,
    billing_address_line1,
    billing_address_line2,
    billing_city,
    billing_state,
    billing_postal_code,
    billing_country,
  };

  return (
    <Card cssOverride={{ gap: theme.spacing[2], ...(hasError ? styles.cardInvalid : {}) }}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle>
          <Flex gap={2} align="center">
            <Text variant="small" weight="medium">
              {__('Customer', 'kirki-ecommerce')}
            </Text>
            {isDefined(customer) && !customer.user_id && (
              <Badge variant="info">{__('Guest', 'kirki-ecommerce')}</Badge>
            )}
          </Flex>
        </CardTitle>
        {customer && !readonly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={__('More options', 'kirki-ecommerce')}
              >
                <ShowMoreIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setShippingDialogOpen(true)}>
                {__('Edit shipping address', 'kirki-ecommerce')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setBillingDialogOpen(true)}>
                {__('Edit billing address', 'kirki-ecommerce')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setContactDialogOpen(true)}>
                {__('Edit contact information', 'kirki-ecommerce')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleRemove}
                cssOverride={{ color: theme.colors.text.critical }}
              >
                {__('Remove customer', 'kirki-ecommerce')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent cssOverride={styles.cardContent} data-check="true">
        {(hasContactError || hasShippingError || hasBillingError) && (
          <Flex direction="column" gap={2}>
            {hasContactError && (
              <FieldError>{__('Customer information is incomplete', 'kirki-ecommerce')}</FieldError>
            )}
            {hasShippingError && (
              <FieldError>{__('Shipping address is incomplete', 'kirki-ecommerce')}</FieldError>
            )}
            {hasBillingError && (
              <FieldError>{__('Billing address is incomplete', 'kirki-ecommerce')}</FieldError>
            )}
          </Flex>
        )}
        {customer ? (
          <Flex direction="column" gap={3}>
            <CustomerSummary
              name={[values.customer_first_name, values.customer_last_name]
                .filter(Boolean)
                .join(' ')}
              email={values.customer_email}
              phone={values.customer_phone}
              photo={customer.photo}
              billingAddress={formatBillingAddress(values, countries)}
              shippingAddress={formatShippingAddress(values, countries)}
            />
          </Flex>
        ) : (
          <Flex direction="column" gap={2}>
            <CustomerSearchDropdown
              onSelect={handleSelectCustomer}
              onOpenAddDialog={(searchText) => {
                setDialogPrefill(searchText);
                setAddDialogOpen(true);
              }}
            />
            {isDefined(customerError) && <FieldError errors={[customerError]} />}
          </Flex>
        )}
      </CardContent>

      {!readonly && addDialogOpen && (
        <AddCustomerDialog
          open
          onOpenChange={setAddDialogOpen}
          initialSearch={dialogPrefill}
          onCreated={(id) => {
            handleSelectCustomer(id);
            setAddDialogOpen(false);
          }}
        />
      )}

      {!readonly && customer && contactDialogOpen && (
        <ContactInfoDialog
          open
          onOpenChange={setContactDialogOpen}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {!readonly && customer && shippingDialogOpen && (
        <AddressDialog
          open
          onOpenChange={setShippingDialogOpen}
          type="shipping"
          customer={customer}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}

      {!readonly && customer && billingDialogOpen && (
        <AddressDialog
          open
          onOpenChange={setBillingDialogOpen}
          type="billing"
          customer={customer}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}
    </Card>
  );
};

CustomerCard.displayName = 'CustomerCard';

export default CustomerCard;

const styles = defineStyles({
  cardInvalid: {
    borderColor: theme.colors.background.fillCritical,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '28px',
  },
});

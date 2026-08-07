import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import Text from '@/components/ui/text';
import { EditIcon, TrashIcon } from '@/icons';
import AddCustomerDialog from '@/pages/orders/order-create/components/customer/add-customer-dialog';
import CustomerInfoDialog from '@/pages/orders/order-create/components/customer/customer-info-dialog';
import CustomerSearchDropdown from '@/pages/orders/order-create/components/customer/customer-search-dropdown';
import CustomerSummary from '@/pages/orders/order-create/components/customer/customer-summary';
import {
  formatBillingAddress,
  formatShippingAddress,
  toOrderAddresses,
} from '@/pages/orders/order-create/config/customer-address';
import { useCountriesQuery } from '@/services/country';
import { useCustomerQuery } from '@/services/customer';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { OrderFormInput } from '@/types';
import { __ } from '@/wpi18n';

const CustomerCard = () => {
  const form = useFormContext<OrderFormInput>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [dialogPrefill, setDialogPrefill] = useState('');
  const appliedCustomerId = useRef<number | undefined>(undefined);

  const customerId = form.watch('customer_id');
  const { data: customer } = useCustomerQuery(
    Number(customerId ?? 0),
    Boolean(customerId),
  );
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const error = form.formState.errors.customer_id;

  useEffect(() => {
    if (!customer || appliedCustomerId.current === customer.id) {
      return;
    }

    appliedCustomerId.current = customer.id;
    form.reset({ ...form.getValues(), ...toOrderAddresses(customer) });
  }, [customer, form]);

  const handleRemove = () => {
    appliedCustomerId.current = undefined;
    form.setValue('customer_id', undefined, { shouldValidate: true });
  };

  const values = form.watch();

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle><Text variant="small" weight='medium'>{__('Customer', 'kirki-ecommerce')}</Text></CardTitle>
        {customer && (
          <ActionGroup>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Remove customer"
              onClick={handleRemove}
            >
              <TrashIcon />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Edit customer information"
              onClick={() => setInfoDialogOpen(true)}
            >
              <EditIcon />
            </Button>
          </ActionGroup>
        )}
      </CardHeader>
      <CardContent>
        {customer ? (
          <CustomerSummary
            name={[values.shipping_first_name, values.shipping_last_name]
              .filter(Boolean)
              .join(' ')}
            email={values.shipping_email}
            phone={values.shipping_phone}
            photo={customer.photo}
            billingAddress={formatBillingAddress(values, countries)}
            shippingAddress={formatShippingAddress(values, countries)}
          />
        ) : (
          <CustomerSearchDropdown
            onSelect={(id) =>
              form.setValue('customer_id', id, { shouldValidate: true })
            }
            onOpenAddDialog={(searchText) => {
              setDialogPrefill(searchText);
              setAddDialogOpen(true);
            }}
          />
        )}
        {error && <FieldError errors={[error]} />}
      </CardContent>

      {addDialogOpen && (
        <AddCustomerDialog
          open
          onOpenChange={setAddDialogOpen}
          initialSearch={dialogPrefill}
          onCreated={(id) => {
            form.setValue('customer_id', id, { shouldValidate: true });
            setAddDialogOpen(false);
          }}
        />
      )}

      {infoDialogOpen && (
        <CustomerInfoDialog open onOpenChange={setInfoDialogOpen} />
      )}
    </Card>
  );
};

CustomerCard.displayName = 'CustomerCard';

export default CustomerCard;

const styles = defineStyles({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

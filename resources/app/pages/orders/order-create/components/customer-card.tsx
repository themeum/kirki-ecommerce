import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
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
import type { OrderFormInput } from '@/schemas/forms/order-form';
import { useCountriesQuery } from '@/services/country';
import { useCustomerQuery } from '@/services/customer';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type CustomerCardProps = {
  onSave?: () => void;
  isSaving?: boolean;
  readonly?: boolean;
};

const CustomerCard = ({ onSave, isSaving, readonly = false }: CustomerCardProps) => {
  const form = useFormContext<OrderFormInput>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);
  const [dialogPrefill, setDialogPrefill] = useState('');
  const snapshot = useRef(form.getValues());
  const shouldApplyCustomerAddress = useRef(false);

  const customerId = useWatch({ control: form.control, name: 'customer_id' });
  const { data: customer } = useCustomerQuery(
    Number(customerId ?? 0),
    Boolean(customerId),
  );
  const { data: countries = [] } = useCountriesQuery({ limit: -1 });
  const error = form.formState.errors.customer_id;

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
    form.setValue('customer_id', undefined, { shouldValidate: true });
    setIsChangingCustomer(true);
  };

  const handleCancelChange = () => {
    shouldApplyCustomerAddress.current = false;
    form.reset(snapshot.current);
    setIsChangingCustomer(false);
  };

  const handleSaveChange = () => {
    setIsChangingCustomer(false);
    onSave?.();
  };

  const values = useWatch({ control: form.control });

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={styles.headerRow}>
        <CardTitle><Text variant="small" weight="medium">{__('Customer', 'kirki-ecommerce')}</Text></CardTitle>
        {customer && !readonly && (
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
            onSelect={handleSelectCustomer}
            onOpenAddDialog={(searchText) => {
              setDialogPrefill(searchText);
              setAddDialogOpen(true);
            }}
          />
        )}
        {error && <FieldError errors={[error]} />}
        {!readonly && onSave && isChangingCustomer && (
          <Flex gap={2} justify="flex-end" cssOverride={styles.changeActions}>
            <Button variant="ghost" onClick={handleCancelChange}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              loading={isSaving}
              disabled={!customerId}
              onClick={handleSaveChange}
            >
              {__('Save', 'kirki-ecommerce')}
            </Button>
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

      {!readonly && infoDialogOpen && (
        <CustomerInfoDialog
          open
          onOpenChange={setInfoDialogOpen}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeActions: {
    marginTop: theme.spacing[3],
  },
});

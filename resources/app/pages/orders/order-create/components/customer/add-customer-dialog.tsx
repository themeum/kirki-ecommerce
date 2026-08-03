import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import TagManagerField from '@/components/form/tag-manager-field';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import BillingAddress from '@/pages/customers/customer-details/billing-address';
import CustomerOverview from '@/pages/customers/customer-details/customer-overview';
import ShippingAddress from '@/pages/customers/customer-details/shipping-address';
import { CustomerFormSchema, type CustomerFormValues } from '@/schemas/forms/customer-form';
import { useCreateCustomerMutation } from '@/services/customer';
import type { CustomerFormData } from '@/types';
import { __ } from '@/wpi18n';

type AddCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearch?: string;
  onCreated: (customerId: number) => void;
};

const toCustomerFormData = (values: CustomerFormValues): CustomerFormData => {
  const contact = {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone ?? undefined,
  };

  const data: CustomerFormData = {
    ...values,
    photo: typeof values.photo === 'string' ? Number(values.photo) : values.photo,
    shipping_address: { ...(values.shipping_address ?? {}), ...contact },
  };

  if (!values.is_billing_same_as_shipping) {
    data.billing_address = { ...(values.billing_address ?? {}), ...contact };
  }

  return data;
};

const AddCustomerDialog = ({
  open,
  onOpenChange,
  initialSearch = '',
  onCreated,
}: AddCustomerDialogProps) => {
  const createMutation = useCreateCustomerMutation();
  const trimmedSearch = initialSearch.trim();
  const isEmail = trimmedSearch.includes('@');

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: {
      first_name: isEmail ? '' : trimmedSearch,
      last_name: '',
      email: isEmail ? trimmedSearch : '',
      phone: '',
      language: 'english',
      accepts_marketing: false,
      photo: null,
      shipping_address: {},
      billing_address: {},
      is_billing_same_as_shipping: false,
      tags: [],
    },
  });

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      const response = await createMutation.mutateAsync(toCustomerFormData(values));
      onCreated(response.data.id);
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Form {...form}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent cssOverride={{ width: '720px' }}>
          <DialogHeader>
            <DialogTitle>{__('Add customer', 'kirki-ecommerce')}</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <Flex direction="column" gap={4}>
              <CustomerOverview />
              <ShippingAddress />
              <BillingAddress />
              <TagManagerField
                name="tags"
                valueAs="strings"
                label={__('Tags', 'kirki-ecommerce')}
                placeholder={__('i.e VIP, Wholesale, Local', 'kirki-ecommerce')}
                hasAddBtn={false}
                suggestions={[]}
              />
            </Flex>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              loading={createMutation.isPending}
            >
              {__('Create', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

AddCustomerDialog.displayName = 'AddCustomerDialog';

export default AddCustomerDialog;

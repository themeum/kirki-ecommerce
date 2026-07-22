import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';

import TagManagerField from '@/components/form/tag-manager-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import { CLASS_PREFIX, NEW_ITEM_ID } from '@/conf';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import {
  CustomerFormSchema,
  type CustomerFormValues,
} from '@/schemas/forms/customer-form';
import {
  useCreateCustomerMutation,
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '@/services/customer';
import type { CustomerFormData } from '@/types';
import { __ } from '@/wpi18n';

import BillingAddress from '@/pages/customers/customer-details/billing-address';
import CustomerOverview from '@/pages/customers/customer-details/customer-overview';
import ShippingAddress from '@/pages/customers/customer-details/shipping-address';

const emptyValues: CustomerFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  language: 'english',
  accepts_marketing: false,
  photo: null,
  shipping_address: {},
  billing_address: {},
  is_billing_same_as_shipping: false,
  tags: [],
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<number | undefined>();

  const isNew = id === NEW_ITEM_ID;
  const numericId = isNew ? 0 : Number(id);

  const { data: customerData } = useCustomerQuery(numericId, !isNew);
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!customerData) {
      return;
    }

    const loadedCustomer = customerData as CustomerFormData & { id?: number };
    setCustomerId(loadedCustomer.id);
    form.reset({
      first_name: loadedCustomer.first_name ?? '',
      last_name: loadedCustomer.last_name ?? '',
      email: loadedCustomer.email ?? '',
      phone: loadedCustomer.phone ?? '',
      language: loadedCustomer.language ?? 'english',
      accepts_marketing: Boolean(loadedCustomer.accepts_marketing),
      photo:
        loadedCustomer.photo && typeof loadedCustomer.photo === 'object'
          ? loadedCustomer.photo.id
          : (loadedCustomer.photo ?? null),
      shipping_address: loadedCustomer.shipping_address ?? {},
      billing_address: loadedCustomer.billing_address ?? {},
      is_billing_same_as_shipping: Boolean(
        loadedCustomer.is_billing_same_as_shipping,
      ),
      tags: loadedCustomer.tags ?? [],
    });
  }, [customerData, form]);

  const handleSubmit = async (values: CustomerFormValues) => {
    const updatedCustomerData: CustomerFormData = {
      ...values,
      photo:
        values.photo == null
          ? null
          : typeof values.photo === 'string'
            ? Number(values.photo)
            : values.photo,
      shipping_address: {
        ...(values.shipping_address ?? {}),
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone ?? undefined,
        postal_code:
          values.shipping_address?.postal_code != null
            ? String(values.shipping_address.postal_code)
            : undefined,
      },
    };

    if (!values.is_billing_same_as_shipping) {
      updatedCustomerData.billing_address = {
        ...(values.billing_address ?? {}),
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone ?? undefined,
        postal_code:
          values.billing_address?.postal_code != null
            ? String(values.billing_address.postal_code)
            : undefined,
      };
    }

    try {
      if (customerId) {
        await updateMutation.mutateAsync({
          id: customerId,
          data: updatedCustomerData,
        });
      } else {
        const result = await createMutation.mutateAsync(updatedCustomerData);
        navigate('/customers/' + result.data.id);
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  return (
    <Form {...form}>
      <PageHeading
        text={
          isNew
            ? __('New Customer', 'kirki-ecommerce')
            : __('Edit Customer', 'kirki-ecommerce')
        }
        type="primary"
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                window.history.back();
              }}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={form.handleSubmit(handleSubmit)}
              loading={isSubmitting}
            >
              {isNew
                ? __('Create', 'kirki-ecommerce')
                : __('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
        hasBack
        sticky
      />
      <Container>
        <Flex gap={16}>
          <Flex direction="column" gap={16} style={{ width: '70%' }}>
            <CustomerOverview />
            <ShippingAddress />
            <BillingAddress />
          </Flex>

          <Flex direction="column" gap={16} style={{ width: '30%' }}>
            <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
              <CardContent>
                <Flex direction="column" gap={16}>
                  <Label>{__('Notes', 'kirki-ecommerce')}</Label>
                  <Button variant="secondary" style={{ width: '100%' }}>
                    <PlusIcon />
                    {__('Add note', 'kirki-ecommerce')}
                  </Button>
                </Flex>
              </CardContent>
            </Card>

            <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}>
              <CardContent>
                <TagManagerField
                  name="tags"
                  valueAs="strings"
                  label={__('Tags', 'kirki-ecommerce')}
                  placeholder={__('i.e VIP, Wholsale, Local', 'kirki-ecommerce')}
                  hasAddBtn={false}
                  hasSearchIcon={false}
                  suggestions={[]}
                />
              </CardContent>
            </Card>
          </Flex>
        </Flex>
      </Container>
    </Form>
  );
};

CustomerDetails.displayName = 'CustomerDetails';

export default CustomerDetails;

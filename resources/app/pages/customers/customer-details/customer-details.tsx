import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router';

import MultiSelectField from '@/components/form/multi-select-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { cardStyles } from '@/theme/card-styles';
import {
  CustomerFormSchema,
  type CustomerFormInput,
  type CustomerFormPayload,
} from '@/schemas/forms/customer-form';
import { useCreateCustomerMutation, useCustomerQuery, useUpdateCustomerMutation } from '@/services/customer';
import { __ } from '@/wpi18n';

import BillingAddress from '@/pages/customers/customer-details/billing-address';
import CustomerOverview from '@/pages/customers/customer-details/customer-overview';
import ShippingAddress from '@/pages/customers/customer-details/shipping-address';

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

  const form = useForm<CustomerFormInput, unknown, CustomerFormPayload>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: getDefaults(CustomerFormSchema),
  });

  useEffect(() => {
    if (!customerData) {
      return;
    }

    setCustomerId(customerData.id);
    form.reset(pickFormValues(CustomerFormSchema, customerData));
  }, [customerData, form]);

  const handleSubmit = async (payload: CustomerFormPayload) => {
    try {
      if (customerId) {
        await updateMutation.mutateAsync({
          id: customerId,
          data: payload,
        });
      } else {
        const result = await createMutation.mutateAsync(payload);
        navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id: result.data.id }));
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
              onClick={() => {
                window.history.back();
              }}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
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
        <Flex gap={4}>
          <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
            <CustomerOverview />
            <ShippingAddress />
            <BillingAddress />
          </Flex>

          <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
            <Card cssOverride={cardStyles.formCard}>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Label>{__('Notes', 'kirki-ecommerce')}</Label>
                  <Button variant="secondary" style={{ width: '100%' }}>
                    <PlusIcon />
                    {__('Add note', 'kirki-ecommerce')}
                  </Button>
                </Flex>
              </CardContent>
            </Card>

            <Card cssOverride={cardStyles.formCard}>
              <CardContent>
                <MultiSelectField
                  name="tags"
                  valueAs="strings"
                  label={__('Tags', 'kirki-ecommerce')}
                  placeholder={__('i.e VIP, Wholsale, Local', 'kirki-ecommerce')}
                  createLabel={__('Add Tag', 'kirki-ecommerce')}
                  creatable
                  options={[]}
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


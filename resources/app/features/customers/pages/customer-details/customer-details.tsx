import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import MultiSelectField from '@/components/form/multi-select-field';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Label from '@/components/ui/label';
import PageHeading from '@/components/ui/page-heading';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import BillingAddress from '@/features/customers/pages/customer-details/billing-address';
import CustomerOverview from '@/features/customers/pages/customer-details/customer-overview';
import ShippingAddress from '@/features/customers/pages/customer-details/shipping-address';
import {
  type CustomerFormInput,
  type CustomerFormPayload,
  CustomerFormSchema,
} from '@/features/customers/schemas/forms/customer-form';
import {
  useCreateCustomerMutation,
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '@/features/customers/services/customer';
import CustomerDetailsSkeleton from '@/features/customers/skeletons/customer-details-skeleton';
import { PlusIcon } from '@/icons';
import type { ErrorResponse } from '@/libs/api';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState<number | undefined>();

  const isNew = id === NEW_ITEM_ID;
  const numericId = isNew ? 0 : Number(id);

  const { data: customerData, isLoading } = useCustomerQuery(numericId, !isNew);
  const isLoadingCustomer = !isNew && isLoading;
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
        void navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id: result.data.id }), {
          replace: true,
        });
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBack = () => {
    void navigate(-1);
  };

  return (
    <Form {...form}>
      <PageHeading
        text={
          isNew ? __('New Customer', 'kirki-ecommerce') : __('Edit Customer', 'kirki-ecommerce')
        }
        type="primary"
        actions={
          <>
            <Button variant="ghost" onClick={handleBack}>
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              loading={isSubmitting}
            >
              {isNew ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
            </Button>
          </>
        }
        hasBack
        onBack={handleBack}
        sticky
      />
      {isLoadingCustomer ? (
        <CustomerDetailsSkeleton />
      ) : (
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
      )}
    </Form>
  );
};

CustomerDetails.displayName = 'CustomerDetails';

export default CustomerDetails;

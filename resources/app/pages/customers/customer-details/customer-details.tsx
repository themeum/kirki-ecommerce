import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { NEW_ITEM_ID } from '@/conf';
import { PlusIcon } from '@/icons';
import { getErrorsObject, type ErrorResponse } from '@/libs/api';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import PageHeading from '@/molecules/page-heading';
import { TagManager } from '@/molecules/tag-manager';
import {
  useCreateCustomerMutation,
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '@/services/customer';
import type {
  CustomerFormData,
  FormErrors,
  SelectOption,
} from '@/types';
import { __ } from '@/wpi18n';

import BillingAddress from '@/pages/customers/customer-details/billing-address';
import CustomerOverview from '@/pages/customers/customer-details/customer-overview';
import ShippingAddress from '@/pages/customers/customer-details/shipping-address';

type CustomerDetailsFormData = CustomerFormData & {
  id?: number;
};

const CustomerDetails = () => {
  let { id } = useParams();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FormErrors>({});
  const [customerFormData, setCustomerFormData] =
    useState<CustomerDetailsFormData>({});
  const [selectedTags, setSelectedTags] = useState<SelectOption[]>([]);

  const isNew = id === NEW_ITEM_ID;
  const numericId = isNew ? 0 : Number(id);

  const { data: customerData } = useCustomerQuery(numericId, !isNew);
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  useEffect(() => {
    if (!customerData) {
      return;
    }
    setCustomerFormData(customerData);
    const tagList = (customerData?.tags || []).map((tag) => ({
      title: tag,
      value: tag,
    }));
    setSelectedTags(tagList);
  }, [customerData]);

  const handleOnChange = (
    data: unknown,
    fieldName: string,
    subFieldName?: string,
  ) => {
    setCustomerFormData((prev) => ({
      ...prev,
      [fieldName]: !subFieldName
        ? data
        : {
            ...(prev[fieldName as keyof CustomerDetailsFormData] as
              | Record<string, unknown>
              | undefined),
            [subFieldName]: data,
          },
    }));
    setErrors((prev) => ({
      ...prev,
      [`${fieldName}${subFieldName ? `.${subFieldName}` : ''}`]: null,
    }));
  };

  const handleSameAsShipping = (value: boolean) => {
    setCustomerFormData((prev) => ({
      ...prev,
      is_billing_same_as_shipping: value,
      billing_address: value
        ? {}
        : {
            ...prev.billing_address,
          },
    }));
  };

  const handleAddOrUpdateCustomer = async () => {
    let updatedCustomerData: CustomerDetailsFormData = { ...customerFormData };
    updatedCustomerData.shipping_address = {
      ...customerFormData?.shipping_address,
      first_name: customerFormData?.first_name,
      last_name: customerFormData?.last_name,
      email: customerFormData?.email,
      phone: customerFormData?.phone ?? undefined,
    };
    if (!customerFormData?.is_billing_same_as_shipping) {
      updatedCustomerData.billing_address = {
        ...customerFormData?.billing_address,
        first_name: customerFormData?.first_name,
        last_name: customerFormData?.last_name,
        email: customerFormData?.email,
        phone: customerFormData?.phone ?? undefined,
      };
    }

    try {
      if (customerFormData.id) {
        await updateMutation.mutateAsync({
          id: customerFormData.id,
          data: updatedCustomerData,
        });
      } else {
        const result = await createMutation.mutateAsync(updatedCustomerData);
        navigate('/customers/' + result.data.id);
      }
    } catch (error) {
      const err = error as ErrorResponse;
      if (err.errors) {
        setErrors(getErrorsObject(err.errors));
      }
    }
  };

  const handleTagRemove = (tag: SelectOption) => {
    const updatedSelectedTags = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setCustomerFormData((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((item) => item !== tag.value),
    }));
    setSelectedTags(updatedSelectedTags);
  };

  const handleAddNewTag = (tagTitle: string) => {
    const updatedSelectedTags = [
      { value: tagTitle, title: tagTitle },
      ...selectedTags,
    ];
    setSelectedTags(updatedSelectedTags);
    setCustomerFormData((prev) => ({
      ...prev,
      tags: [tagTitle, ...(prev.tags ?? [])],
    }));
  };

  return (
    <>
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
              type="ghost"
              size="small"
              text={__('Cancel', 'kirki-ecommerce')}
              onClick={() => {
                window.history.back();
              }}
            />
            <Button
              type="primary"
              size="small"
              onClick={handleAddOrUpdateCustomer}
              text={
                isNew
                  ? __('Create', 'kirki-ecommerce')
                  : __('Save', 'kirki-ecommerce')
              }
            />
          </>
        }
        hasBack
        sticky
      />
      <Container>
        <Flex gap={16}>
          <Flex direction="column" gap={16} style={{ width: '70%' }}>
            <CustomerOverview
              customerFormData={customerFormData}
              errors={errors}
              handleOnChange={handleOnChange}
            />
            <ShippingAddress
              customerFormData={customerFormData}
              errors={errors}
              handleOnChange={handleOnChange}
            />

            <BillingAddress
              customerFormData={customerFormData}
              errors={errors}
              handleOnChange={handleOnChange}
              handleSameAsShipping={handleSameAsShipping}
            />
          </Flex>

          <Flex direction="column" gap={16} style={{ width: '30%' }}>
            <Card type="form">
              <Label text={__('Notes', 'kirki-ecommerce')} />
              <Button
                type="secondary"
                text={__('Add note', 'kirki-ecommerce')}
                leftIcon={<PlusIcon />}
                style={{ width: '100%' }}
              />
            </Card>

            <Card type="form">
              <TagManager
                label={__('Tags', 'kirki-ecommerce')}
                placeholder={__('i.e VIP, Wholsale, Local', 'kirki-ecommerce')}
                selectedTags={selectedTags}
                hasAddBtn={false}
                hasSearchIcon={false}
                suggestions={[]}
                onNewTagAdd={(tag) => handleAddNewTag(tag)}
                onTagRemove={(tag) => {
                  handleTagRemove(tag);
                }}
              />
            </Card>
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

CustomerDetails.displayName = 'CustomerDetails';

export default CustomerDetails;

import { NEW_ITEM_ID } from "@/conf";
import { PlusIcon, ShowMoreIcon } from "@/icons";
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Label from '@/molecules/label';
import PageHeading from '@/molecules/page-heading';
import TagManager from '@/molecules/tag-manager/tag-manager';
import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { __ } from "@/wpi18n";
import {
  addCustomerAPI,
  getCustomerByIdAPI,
  setKeyValue,
  updateCustomer,
  updateCustomerAPI,
} from "../../../store/customersSlice";
import { getErrorsObject } from "../../../store/utils";
import { useDispatch } from "react-redux";
import CustomerOverview from './customer-overview';
import ShippingAddress from './shipping-address';
import BillingAddress from './billing-address';

const CustomerDetails = () => {
  let { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({});
  const [customerFormData, setCustomerFormData] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    if (!isNew()) {
      getCustomerByIdAPI(id).then((result) => {
        if (result.success) {
          console.log(result);
          setCustomerFormData(result.data);
          const tagList = (result?.data?.tags || []).map((tag) => {
            return { title: tag, value: tag };
          });
          setSelectedTags(tagList);
        }
      });
    }
  }, [id]);

  const handleOnChange = (data, fieldName, subFieldName) => {
    setCustomerFormData((prev) => ({
      ...prev,
      [fieldName]: !subFieldName
        ? data
        : {
            ...prev[fieldName],
            [subFieldName]: data,
          },
    }));
    setErrors((prev) => ({
      ...prev,
      [`${fieldName}${subFieldName ? `.${subFieldName}` : ""}`]: null,
    }));
  };

  const handleSameAsShipping = (value) => {
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
    let result = {};
    console.log(customerFormData);
    let updatedCustomerData = { ...customerFormData };
    updatedCustomerData.shipping_address = {
      ...customerFormData?.shipping_address,
      first_name: customerFormData?.first_name,
      last_name: customerFormData?.last_name,
      email: customerFormData?.email,
      phone: customerFormData?.phone,
    };
    if (!customerFormData?.is_billing_same_as_shipping) {
      updatedCustomerData.billing_address = {
        ...customerFormData?.billing_address,
        first_name: customerFormData?.first_name,
        last_name: customerFormData?.last_name,
        email: customerFormData?.email,
        phone: customerFormData?.phone,
      };
    }

    if (customerFormData.id) {
      result = await updateCustomerAPI(
        customerFormData.id,
        updatedCustomerData,
      );
    } else {
      result = await addCustomerAPI(updatedCustomerData);
    }

    if (result.success) {
      if (isNew()) {
        navigate("/customers/" + result.data.id);
      }
      if (customerFormData.id) {
        dispatch(updateCustomer(result.data));
      } else {
        dispatch(setKeyValue({ key: "toggler", value: Date.now() }));
      }
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };
  const isNew = () => {
    return id === NEW_ITEM_ID;
  };

  const handleTagRemove = (tag) => {
    const updatedSelectedTags = selectedTags.filter(
      (item) => item.value !== tag.value,
    );
    setCustomerFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag.value),
    }));
    setSelectedTags(updatedSelectedTags);
  };

  const handleAddNewTag = (tagTitle) => {
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
          isNew() ? __("New Customer", "kirki-ecommerce") : __("Edit Customer", "kirki-ecommerce")
        }
        type="primary"
        actions={
          <>
            <Button
              type="ghost"
              size="small"
              text={__("Cancel", "kirki-ecommerce")}
              onClick={() => {
                window.history.back();
              }}
            />
            <Button
              type="primary"
              size="small"
              onClick={handleAddOrUpdateCustomer}
              text={isNew() ? __("Create", "kirki-ecommerce") : __("Save", "kirki-ecommerce")}
            />
          </>
        }
        hasBack
        sticky
      />
      <Container>
        <Flex gap={16}>
          <Flex direction="column" gap={16} style={{ width: "70%" }}>
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

          <Flex direction="column" gap={16} style={{ width: "30%" }}>
            <Card type="form">
              <Label text={__("Notes", "kirki-ecommerce")} />
              <Button
                type="secondary"
                text={__("Add note", "kirki-ecommerce")}
                leftIcon={<PlusIcon />}
                style={{ width: "100%" }}
              />
            </Card>

            <Card type="form">
              <TagManager
                label={__("Tags", "kirki-ecommerce")}
                placeholder={__("i.e VIP, Wholsale, Local", "kirki-ecommerce")}
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

export default CustomerDetails;

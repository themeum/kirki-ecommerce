import React, { useState, useEffect } from "react";
import { __ } from "@/wpi18n";

import Flex from '@/molecules/flex';
import Button from '@/molecules/button';
import { getFormField } from './utils';
import { updatePaymentGatewayAPI } from "../../../store/settingsSlice";
import { getErrorsObject } from "../../../store/utils";
import { dispatchToastMessage } from "../../utils";
import { Popover, PopoverBody, PopoverFooter, PopoverHeader } from '@/molecules/popover';

const PaymentGatewayEditPopup = ({ editedItem, isOpen, onClose }) => {
  const [gatewayConfObj, setGatewayConfObj] = useState({});
  const [inputFieldType, setInputFieldType] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editedItem?.settings) setGatewayConfObj(editedItem?.settings);
  }, [editedItem]);

  const handleRightAction = (key) => {
    setInputFieldType((prev) => ({
      ...prev,
      [key]: (prev[key] || "password") === "password" ? "text" : "password",
    }));
  };

  const handleOnChange = (value, key = "") => {
    setGatewayConfObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleUpdateData = async () => {
    const updatedObj = {
      data: {
        ...gatewayConfObj,
        is_enabled: true,
      },
    };
    const result = await updatePaymentGatewayAPI(editedItem?.id, updatedObj);

    if (result?.success) {
      dispatchToastMessage("success", {
        title: __("Payment gateway updated", "kirki-ecommerce"),
      });
      onClose();
      setGatewayConfObj({});
    } else {
      setErrors(getErrorsObject(result?.errors));
    }
  };

  return (
    <Popover isOpen={isOpen} style={{ width: "600px" }}>
      <PopoverHeader onClose={onClose}>
        {__("Edit Payment Gateways", "kirki-ecommerce")}
      </PopoverHeader>
      <PopoverBody
        style={{
          padding:
            "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
        }}
      >
        <Flex direction="column" gap={16}>
          {editedItem?.fields?.map((field) => {
            const fieldKey = field?.name;
            const isSecret = fieldKey.includes("secret");
            const currentType =
              inputFieldType[fieldKey] || (isSecret ? "password" : "text");
            return (
              <div key={fieldKey}>
                {getFormField(
                  field,
                  handleOnChange,
                  fieldKey,
                  handleRightAction,
                  currentType,
                  gatewayConfObj,
                  errors
                )}
              </div>
            );
          })}
        </Flex>
      </PopoverBody>
      <PopoverFooter>
        <Button
          type="secondary"
          size="small"
          text={__("Cancel", "kirki-ecommerce")}
          onClick={onClose}
        />
        <Button
          type="primary"
          size="small"
          text={__("Save", "kirki-ecommerce")}
          onClick={handleUpdateData}
        />
      </PopoverFooter>
    </Popover>
  );
};

export default PaymentGatewayEditPopup;

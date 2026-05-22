import ThumbnailSelector from '@/components/thumbnail-selector';
import Button from '@/molecules/button';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Popover from '@/molecules/popover/popover';
import PopoverBody from '@/molecules/popover/popover-body';
import PopoverFooter from '@/molecules/popover/popover-footer';
import PopoverHeader from '@/molecules/popover/popover-header';
import RichText from '@/molecules/rich-text';
import Text from '@/molecules/text';
import React, { useEffect } from "react";
import { useState } from "react";
import { __, sprintf } from "@/wpi18n";
import { getErrorsObject } from "../../../store/utils";
import {
  createPaymentMethodAPI,
  updatePaymentMethodAPI,
} from "../../../store/settingsSlice";

const ManualPaymentPopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    setIsMethodListUpdated,
    editingMethod,
    setEditingMethod,
  } = props;
  const [icon, setIcon] = useState("");
  const [manualPaymentData, setManualPaymentData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingMethod) {
      setManualPaymentData(editingMethod);
      setIcon(editingMethod?.icon);
    }
  }, [editingMethod]);

  const handleOnChange = (value, key) => {
    setManualPaymentData((prev) => {
      if (key === "icon") {
        setIcon(value?.url);
        return {
          ...prev,
          [key]: value?.url,
        };
      }
      return {
        ...prev,
        [key]: value,
        ["is_manual"]: true,
      };
    });

    setErrors((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  const handleSaveOrUpdateData = async () => {
    const isEdit = Boolean(editingMethod);
    const result = isEdit
      ? await updatePaymentMethodAPI(editingMethod.id, manualPaymentData)
      : await createPaymentMethodAPI(manualPaymentData);

    if (!result?.success) {
      setErrors(getErrorsObject(result.errors));
      return;
    }
    setIcon("");
    setManualPaymentData({});
    setOpenPopup(false);
    setEditingMethod(null);
    setIsMethodListUpdated(true);
  };

  return (
    <>
      <Popover isOpen={openPopup} style={{ width: "600px" }}>
        <PopoverHeader
          style={{ padding: "var(--decom-spacing-5)" }}
          onClose={() => setOpenPopup(false)}
        >
          {__("Add Manual Payment Method", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding:
              "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
          }}
        >
          <Flex direction="column" gap={16}>
            <Input
              label={__("Method Name", "kirki-ecommerce")}
              value={manualPaymentData?.name || ""}
              placeholder={__("e.g. Cash on Delivery (COD)", "kirki-ecommerce")}
              onChange={(value) => handleOnChange(value, "name")}
              error={errors["name"]}
            />
            <ThumbnailSelector
              label={__("Icon", "kirki-ecommerce")}
              helpText={__("Icon", "kirki-ecommerce")}
              src={icon}
              placeholder={__("Recommended image size: 48x48", "kirki-ecommerce")}
              onChange={(img) => handleOnChange(img, "icon")}
              error={errors["icon"]}
            />
            <Flex direction="column" gap={8}>
              <RichText
                label={__("Payment Instructions", "kirki-ecommerce")}
                placeholder={__(
                  "Type instructions related to payment method",
                  "kirki-ecommerce"
                )}
                value={sprintf(
                  __("%s", "kirki-ecommerce"),
                  manualPaymentData?.description
                )}
                onChange={(value) => handleOnChange(value, "instructions")}
              />
              <Text
                subHeader={__(
                  "Provide clear, step-by-step instructions on how to complete the payment",
                  "kirki-ecommerce"
                )}
                type="xsm"
              />
            </Flex>
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="secondary"
            size="small"
            text={__("Cancel", "kirki-ecommerce")}
            onClick={() => setOpenPopup(false)}
          />
          <Button
            type="primary"
            size="small"
            text={__("Save", "kirki-ecommerce")}
            onClick={handleSaveOrUpdateData}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default ManualPaymentPopup;

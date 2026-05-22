import React, { useState, useEffect } from "react";
import {
  PageHeading,
  Button,
  Container,
  Flex,
  Card,
  Text,
  ToggleButton,
  ActionGroup,
} from "../../../molecules";
import { CartIcon } from "@/Icons";
import PageNavbar from "../../../components/PageNavbar";
import { __ } from "@/wpi18n";
import CheckoutConf from "./CheckoutConf";
import LegalInfo from "./LegalInfo";
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";
import { useNavigate, useOutletContext } from "react-router";
import { getErrorsObject } from "../../../store/utils";
import { useDispatch, useSelector } from "react-redux";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../utils";
import { dispatchToastMessage } from "../../utils";

const CONF_KEYS = [
  "address_line_validation",
  "phone_number_validation",
  "company_name_validation",
  "company_id_validation",
  "vat_identification_number_validation",
  "has_apply_coupon_code",
];

const initialDataObj = {
  is_allowed_guest_checkout: false,
  checkout_configuration: {
    address_line_validation: "",
    phone_number_validation: "",
    company_name_validation: "",
    company_id_validation: "",
    vat_identification_number_validation: "",
    has_apply_coupon_code: true,
  },
  is_terms_and_conditions_visible: false,
  terms_and_conditions_content: "",
  is_privacy_policy_visible: false,
  privacy_policy_content: "",
};

const CheckoutSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();

  const [dataObj, setDataObj] = useState(initialDataObj);
  const [initialData, setInitialData] = useState(initialDataObj);
  const [errors, setErrors] = useState({});

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: checkoutSettingsData } = useSelector(
    (state) => state.settings?.checkout,
  );

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("checkout", {}));
  }, []);

  useEffect(() => {
    if (!checkoutSettingsData || !Object.keys(checkoutSettingsData).length) {
      return;
    }
    const mergedData = {
      ...initialDataObj,
      ...checkoutSettingsData,
      checkout_configuration: {
        ...initialDataObj.checkout_configuration,
        ...checkoutSettingsData.checkout_configuration,
      },
    };

    setDataObj(mergedData);
    setInitialData(mergedData);
  }, [checkoutSettingsData]);

  const handleOnChange = (value, key) => {
    setUnsavedDataStatus(true);

    setDataObj((prev) =>
      CONF_KEYS.includes(key)
        ? {
            ...prev,
            checkout_configuration: {
              ...prev.checkout_configuration,
              [key]: value,
            },
          }
        : {
            ...prev,
            [key]: value,
          },
    );

    setErrors((prev) => ({
      ...prev,
      [CONF_KEYS.includes(key)
        ? `data.checkout_configuration.${key}`
        : `data.${key}`]: null,
    }));
  };

  const handleSaveData = async () => {
    const result = await updateSettingsAPI("checkout", dataObj);

    if (!result?.success) {
      setErrors(getErrorsObject(result.errors));
      return;
    }
    dispatch(updateSettings({ key: "checkout", value: result.data }));
    dispatchToastMessage("success", {
      title: __("Checkout settings updated", "kirki-ecommerce"),
    });
    setUnsavedDataStatus(false);
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
    setErrors({});
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate("/settings"),
        }),
      onClean: () => navigate("/settings"),
    });
  };

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__("Cancel", "kirki-ecommerce")}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                size="small"
                onClick={handleSaveData}
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction={"column"} gap={16}>
            <PageNavbar
              textIcon={<CartIcon />}
              text={__("Checkout", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />
            <Card type="large">
              <Flex style={{ alignItems: "center" }}>
                <Text
                  header={__("Allow Guest Checkout", "kirki-ecommerce")}
                  subHeader={__(
                    "Let customers buy without logging in or creating an account.",
                    "kirki-ecommerce",
                  )}
                  type="secondary"
                />
                <ActionGroup>
                  <ToggleButton
                    value={dataObj?.is_allowed_guest_checkout}
                    onChange={(value) =>
                      handleOnChange(value, "is_allowed_guest_checkout")
                    }
                  />
                </ActionGroup>
              </Flex>
            </Card>
            <CheckoutConf
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />
            <LegalInfo
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default CheckoutSettings;

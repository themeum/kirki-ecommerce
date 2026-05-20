import React from "react";
import {
  Card,
  Text,
  Select,
  Flex,
  ActionGroup,
  ToggleButton,
} from "../../../molecules";
import { __ } from "wpi18n";

const CheckoutConf = (props) => {
  const optionsArray = [
    { title: __("Optional", "kirki-ecommerce"), value: "optional" },
    { title: __("Mandatory", "kirki-ecommerce"), value: "required" },
  ];
  const { dataObj, handleOnChange, errors } = props;
  return (
    <>
      <Card type="large">
        <Text
          type="primary"
          header={__("Checkout Configuration", "kirki-ecommerce")}
          subHeader={__(
            "Customize your checkout process to suit your preferences.",
            "kirki-ecommerce"
          )}
          style={{ gap: "var(--decom-spacing-f3)" }}
        />
        <Card
          type="form"
          style={{
            border: "1px solid var(--decom-border-border)",
            borderRadius: "var(--decom-radius-rounded-lg)",
          }}
        >
          <Select
            label={__("Address Line", "kirki-ecommerce")}
            helpText={__("Select you address", "kirki-ecommerce")} // should be updated
            value={
              dataObj?.checkout_configuration?.address_line_validation || ""
            }
            onChange={(value) =>
              handleOnChange(value, "address_line_validation")
            }
            optionsArray={optionsArray}
            error={
              errors["data.checkout_configuration.address_line_validation"]
            }
          />
          <Select
            label={__("Phone Number", "kirki-ecommerce")}
            helpText={__("Select you phone number", "kirki-ecommerce")}
            value={dataObj?.checkout_configuration?.phone_number_validation}
            onChange={(value) =>
              handleOnChange(value, "phone_number_validation")
            }
            optionsArray={optionsArray}
            error={
              errors["data.checkout_configuration.phone_number_validation"]
            }
          />
          <Select
            label={__("Company Name", "kirki-ecommerce")}
            helpText={__("Select you company name", "kirki-ecommerce")}
            value={dataObj?.checkout_configuration?.company_name_validation}
            onChange={(value) =>
              handleOnChange(value, "company_name_validation")
            }
            optionsArray={optionsArray}
            error={
              errors["data.checkout_configuration.company_name_validation"]
            }
          />
          <Select
            label={__("Company ID", "kirki-ecommerce")}
            helpText={__("Select you company id", "kirki-ecommerce")}
            value={dataObj?.checkout_configuration?.company_id_validation}
            onChange={(value) => handleOnChange(value, "company_id_validation")}
            optionsArray={optionsArray}
            error={errors["data.checkout_configuration.company_id_validation"]}
          />
          <Select
            label={__("VAT Identification Number (VATIN)", "kirki-ecommerce")}
            helpText={__("Select you VATIN", "kirki-ecommerce")}
            value={
              dataObj?.checkout_configuration
                ?.vat_identification_number_validation
            }
            onChange={(value) =>
              handleOnChange(value, "vat_identification_number_validation")
            }
            optionsArray={optionsArray}
            error={
              errors[
                "data.checkout_configuration.vat_identification_number_validation"
              ]
            }
          />

          <Flex style={{ alignItems: "center" }}>
            <Text
              header={__("Apply Coupon Code", "kirki-ecommerce")}
              subHeader={__(
                "Coupons can be applied from the cart and checkout pages.",
                "kirki-ecommerce"
              )}
              type="secondary"
            />
            <ActionGroup>
              <ToggleButton
                value={dataObj?.checkout_configuration?.has_apply_coupon_code}
                onChange={(value) =>
                  handleOnChange(value, "has_apply_coupon_code")
                }
              />
            </ActionGroup>
          </Flex>
        </Card>
      </Card>
    </>
  );
};

export default CheckoutConf;

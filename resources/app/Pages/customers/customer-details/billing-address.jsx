import { PaymentIcon } from "@/icons";
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import Select from '@/molecules/select/select';
import Text from '@/molecules/text';
import React from "react";
import { __ } from "@/wpi18n";

const regionArray = [
  { value: "bangladesh", title: "Bangladesh" },
  { value: "uk", title: "United Kingdom" },
  { value: "usa", title: "United States" },
  { value: "spain", title: "Spain" },
];
const BillingAddress = ({
  customerFormData,
  errors,
  handleOnChange,
  handleSameAsShipping,
}) => {
  return (
    <Card
      type="form"
      style={{ padding: "20px", borderRadius: "20px", gap: "20px" }}
    >
      <Text
        header={__("Billing Address", "kirki-ecommerce")}
        type="primary"
        leftIcon={<PaymentIcon />}
        style={{ paddingBottom: "4px" }}
      />
      <Flex direction="column" gap={8}>
        <Card type="innerDark">
          <Checkbox
            value={customerFormData?.is_billing_same_as_shipping || false}
            label="Same as shipping address"
            onChange={(value) => handleSameAsShipping(value)}
          />
        </Card>
        <Card type="inner" style={{ padding: "16px" }}>
          <Flex direction="column" gap={16}>
            <Select
              label={__("Country / Region", "kirki-ecommerce")}
              value={customerFormData?.billing_address?.country || ""}
              optionsArray={regionArray}
              defaultValue="bangladesh"
              onChange={(value) =>
                handleOnChange(value, "billing_address", "country")
              }
              error={errors["billing_address.country"]}
              state={
                customerFormData?.is_billing_same_as_shipping ? "disabled" : ""
              }
            />
            <Input
              label={__("Address", "kirki-ecommerce")}
              value={customerFormData?.billing_address?.address_line1 || ""}
              placeholder={__("e.g. 124 main st", "kirki-ecommerce")}
              onChange={(value) =>
                handleOnChange(value, "billing_address", "address_line1")
              }
              error={errors["billing_address.address_line1"]}
              state={
                customerFormData?.is_billing_same_as_shipping ? "disabled" : ""
              }
            />
            <Input
              label={__("Apartment, suite, etc. (optional)", "kirki-ecommerce")}
              value={customerFormData?.billing_address?.address_line2 || ""}
              onChange={(value) =>
                handleOnChange(value, "billing_address", "address_line2")
              }
              error={errors["billing_address.address_line2"]}
              state={
                customerFormData?.is_billing_same_as_shipping ? "disabled" : ""
              }
            />
            <Grid>
              <Input
                label={__("City", "kirki-ecommerce")}
                value={customerFormData?.billing_address?.city || ""}
                onChange={(value) =>
                  handleOnChange(value, "billing_address", "city")
                }
                error={errors["billing_address.city"]}
                state={
                  customerFormData?.is_billing_same_as_shipping
                    ? "disabled"
                    : ""
                }
              />
              <Input
                label={__("State / Province", "kirki-ecommerce")}
                value={customerFormData?.billing_address?.state || ""}
                onChange={(value) =>
                  handleOnChange(value, "billing_address", "state")
                }
                error={errors["billing_address.state"]}
                state={
                  customerFormData?.is_billing_same_as_shipping
                    ? "disabled"
                    : ""
                }
              />
            </Grid>
            <Input
              label={__("ZIP / Postal code", "kirki-ecommerce")}
              value={customerFormData?.billing_address?.postal_code || ""}
              placeholder={__("+1 (555) 222 4354", "kirki-ecommerce")}
              type="number"
              onChange={(value) =>
                handleOnChange(value, "billing_address", "postal_code")
              }
              error={errors["billing_address.postal_code"]}
              state={
                customerFormData?.is_billing_same_as_shipping ? "disabled" : ""
              }
            />
          </Flex>
        </Card>
      </Flex>
    </Card>
  );
};

export default BillingAddress;

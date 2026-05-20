import { CountrySelector } from "components";
import { ShippingAddressIcon } from "icons";
import { Card, Flex, Grid, Input, Text } from "molecules";
import React from "react";
import { __ } from "wpi18n";

const regionArray = [
  { value: "bangladesh", title: "Bangladesh" },
  { value: "uk", title: "United Kingdom" },
  { value: "usa", title: "United States" },
  { value: "spain", title: "Spain" },
];

const ShippingAddress = ({ customerFormData, errors, handleOnChange }) => {
  return (
    <Card
      type="form"
      style={{ padding: "20px", borderRadius: "20px", gap: "20px" }}
    >
      <Text
        header={__("Shipping Address", "kirki-ecommerce")}
        type="primary"
        leftIcon={<ShippingAddressIcon />}
      />
      <Card type="inner" style={{ padding: "16px" }}>
        <Flex direction="column" gap={16}>
          <CountrySelector
            label={__("Country / Region", "kirki-ecommerce")}
            value={customerFormData?.shipping_address?.country}
            onChange={(value) =>
              handleOnChange(value, "shipping_address", "country")
            }
            error={errors["shipping_address.country"]}
          />
          <Input
            label={__("Address", "kirki-ecommerce")}
            value={customerFormData?.shipping_address?.address_line1}
            placeholder={__("e.g. 124 main st", "kirki-ecommerce")}
            onChange={(value) =>
              handleOnChange(value, "shipping_address", "address_line1")
            }
            error={errors["shipping_address.address_line1"]}
          />
          <Input
            label={__("Apartment, suite, etc. (optional)", "kirki-ecommerce")}
            value={customerFormData?.shipping_address?.address_line2}
            onChange={(value) =>
              handleOnChange(value, "shipping_address", "address_line2")
            }
            error={errors["shipping_address.address_line2"]}
          />
          <Grid>
            <Input
              label={__("City", "kirki-ecommerce")}
              value={customerFormData?.shipping_address?.city}
              onChange={(value) =>
                handleOnChange(value, "shipping_address", "city")
              }
              error={errors["shipping_address.city"]}
            />
            <Input
              label={__("State / Province", "kirki-ecommerce")}
              value={customerFormData?.shipping_address?.state}
              onChange={(value) =>
                handleOnChange(value, "shipping_address", "state")
              }
              error={errors["shipping_address.state"]}
            />
          </Grid>
          <Input
            label={__("ZIP / Postal code", "kirki-ecommerce")}
            value={customerFormData?.shipping_address?.postal_code}
            placeholder={__("+1 (555) 222 4354", "kirki-ecommerce")}
            onChange={(value) =>
              handleOnChange(value, "shipping_address", "postal_code")
            }
            error={errors["shipping_address.postal_code"]}
          />
        </Flex>
      </Card>
    </Card>
  );
};

export default ShippingAddress;

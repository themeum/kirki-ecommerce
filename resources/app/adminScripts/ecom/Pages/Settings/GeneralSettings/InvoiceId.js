import React from "react";
import {
  Card,
  Text,
  Flex,
  Grid,
  Input,
  Select,
  ActionGroup,
  Button,
} from "../../../molecules";
import { ReplaceIcon } from "icons";
import { __ } from "wpi18n";

const InvoiceId = (props) => {
  const { dataObj, handleOnChange, handleResetIDField, errors } = props;

  let invoiceID = `${dataObj?.invoice_id_prefix || ""}${
    dataObj?.invoice_id_sequence || ""
  } ${dataObj?.invoice_id_suffix || ""}`;

  return (
    <div>
      <Card type="large">
        <Text
          header={__("Invoice ID", "kirki-ecommerce")}
          subHeader={__(
            "Customize your invoice ID structure and auto-numbering",
            "kirki-ecommerce"
          )}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />
        <Flex direction={"column"} gap={8}>
          <Card type="inner" style={{ padding: "var(--decom-spacing-4)" }}>
            <Flex direction="column" gap={16}>
              <Grid columns={3}>
                <Input
                  label={__("Prefix", "kirki-ecommerce")}
                  value={dataObj?.invoice_id_prefix}
                  onChange={(value) =>
                    handleOnChange(value, "invoice_id_prefix")
                  }
                  placeholder={__("INV-26-", "kirki-ecommerce")}
                  helpText={__("Set invoice id prefix", "kirki-ecommerce")}
                  error={errors["data.invoice_id_prefix"]}
                />

                <Input
                  label={__("Sequence", "kirki-ecommerce")}
                  value={dataObj?.invoice_id_sequence}
                  onChange={(value) =>
                    handleOnChange(value, "invoice_id_sequence")
                  }
                  placeholder={__("000001", "kirki-ecommerce")}
                  helpText={__("Set invoice id sequence", "kirki-ecommerce")}
                  error={errors?.data?.invoice_id_sequence}
                />
                <Input
                  label={__("Suffix", "kirki-ecommerce")}
                  value={dataObj?.invoice_id_suffix}
                  onChange={(value) =>
                    handleOnChange(value, "invoice_id_suffix")
                  }
                  placeholder={__("KIRKI", "kirki-ecommerce")}
                  helpText={__("Set invoice id suffix", "kirki-ecommerce")}
                  error={errors["data.invoice_id_suffix"]}
                />
              </Grid>

              <Card
                type="innerDark"
                style={{
                  padding: "var(--decom-spacing-2) var(--decom-spacing-3)",
                }}
              >
                <Input
                  label={__("Next invoice IDs will look like:", "kirki-ecommerce")}
                  value={__(invoiceID, "kirki-ecommerce")}
                  style={{
                    padding: "var(--decom-spacing-2)",
                    textAlign: "center",
                    color: "var(--decom-text-text-special-3)",
                  }}
                  error={errors["data.invoiceID"]}
                />
              </Card>

              <Select
                label={__("Invoice Counter Reset Schedule", "kirki-ecommerce")}
                onChange={(value) =>
                  handleOnChange(value, "invoice_counter_reset_schedule")
                }
                optionsArray={[
                  { title: __("No Schedule", "kirki-ecommerce"), value: "none" },
                ]}
                defaultValue="none"
                error={errors["data.invoice_counter_reset_schedule"]}
              />
            </Flex>
          </Card>
          <Card
            type="large"
            style={{
              borderRadius: "var(--decom-radius-rounded-lg)",
              border: "1px solid var(--decom-border-border)",
            }}
          >
            <Flex direction="column" gap={10}>
              <Flex style={{ alignItems: "center" }}>
                <Text
                  type="secondary"
                  header={__("Reset Invoice ID", "kirki-ecommerce")}
                />
                <ActionGroup>
                  <Button
                    text={__("Reset Now", "kirki-ecommerce")}
                    size="small"
                    type="secondary"
                    leftIcon={<ReplaceIcon />}
                    onClick={() => handleResetIDField("invoice")}
                  />
                </ActionGroup>
              </Flex>
              <Text
                type="primary"
                subHeader={__(
                  "Reset the Invoice ID to your base ID for new fiscal years, system migration, or legal compliance.",
                  "kirki-ecommerce"
                )}
              />
            </Flex>
          </Card>
        </Flex>
      </Card>
    </div>
  );
};

export default InvoiceId;

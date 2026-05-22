import React from "react";
import { Card, Flex, Text, Input, Button } from "../../../../molecules";
import { PaymentIcon, LocationIcon, TrashIcon } from "@/Icons";
import { __, sprintf } from "@/wpi18n";
import { CLASS_PREFIX } from "@/conf";
import { setUnsavedDataStatus } from "../../utils";
import { dispatchToastMessage } from "../../../utils";

export const TaxRateList = (props) => {
  const { taxRates, applySingleTax, setTaxRates, handleSaveData } = props;

  const handleTaxRate = (item, value) => {
    setUnsavedDataStatus(true);
    setTaxRates((prev) =>
      prev.map((taxRate) =>
        taxRate.state === item.state ? { ...taxRate, rate: value } : taxRate
      )
    );
  };

  const handleDeleteRate = (item) => {
    const initialList = Array.isArray(taxRates) ? [...taxRates] : [];

    const updatedTaxRates = initialList.filter(
      (taxItem) => taxItem.state !== item.state
    );
    setTaxRates(updatedTaxRates);
    dispatchToastMessage("delete", {
      title: __("VAT rate deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setTaxRates(initialList);
      },
      onSuccess: async () => {
        await handleSaveData(updatedTaxRates, "delete");
      },
    });
  };

  return (
    <div>
      {!applySingleTax && !taxRates.length ? (
        <Card type="innerDark" style={{ padding: "36px 0" }}>
          <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
            <PaymentIcon />
            <span style={{ color: "#878593" }}>
              {__("Added tax rates will appear here", "kirki-ecommerce")}
            </span>
          </Flex>
        </Card>
      ) : (
        <Card type={"innerDark"}>
          <Text
            header={__("Tax rates", "kirki-ecommerce")}
            style={{ marginBottom: "var(--decom-spacing-2)" }}
          />
          <Flex gap={2} direction={"column"}>
            {taxRates?.map((item, index) => (
              <Card
                type={"default"}
                key={index}
                className={`${CLASS_PREFIX}-tax-card`}
              >
                <Text header={item?.state} leftIcon={<LocationIcon />} />
                <div className={`${CLASS_PREFIX}-tax-card-content`}>
                  <Text
                    header={sprintf(__("%s %", "kirki-ecommerce"), item?.rate)}
                    className={`${CLASS_PREFIX}-rate-display`}
                  />

                  <Flex gap={8} className={`${CLASS_PREFIX}-edit-group`}>
                    <Input
                      value={item?.rate ?? ""}
                      style={{ width: "72px" }}
                      onChange={(value) => handleTaxRate(item, value)}
                      onBlur={(value) => handleTaxRate(item, value)}
                      type="number"
                      min={0}
                      max={100}
                    />
                    <Button
                      type={"secondary"}
                      size={"icon"}
                      icon={<TrashIcon />}
                      onClick={() => handleDeleteRate(item, index)}
                    />
                  </Flex>
                </div>
              </Card>
            ))}
          </Flex>
        </Card>
      )}
    </div>
  );
};

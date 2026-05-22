import React, { useState, useEffect } from "react";
import {
  Flex,
  Input,
  Checkbox,
  Grid,
  Card,
  Button,
  Text,
} from "../../../../molecules";
import { __ } from "@/wpi18n";
import { PlusIcon, TrashIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";

const RateByWeightSettings = (props) => {
  const { handleOnChange, dataObj } = props;
  const [hasFreeShipping, setHasFreeShipping] = useState(false);
  const [ranges, setRanges] = useState(
    dataObj?.ranges?.length >= 1
      ? dataObj?.ranges
      : [{ from: "", to: "", amount: "" }]
  );

  useEffect(() => {
    handleOnChange(
      ranges
        .filter((r) => r.from !== "" && r.to !== "" && r.amount !== "")
        .map((r) => ({
          from: Number(r.from),
          to: Number(r.to),
          amount: Number(r.amount),
        })),
      "ranges"
    );
  }, [ranges]);

  const addRange = () => {
    setRanges((prev) => [...prev, { from: "", to: "", amount: "" }]);
  };

  const updateRange = (index, key, value) => {
    setRanges((prev) =>
      prev.map((range, i) => (i === index ? { ...range, [key]: value } : range))
    );
  };

  const removeRange = (index) => {
    setRanges((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Flex direction="column" gap={16}>
      <Input
        type="text"
        multiline
        value={dataObj?.description || ""}
        label={__("Pickup Instructions", "kirki-ecommerce")}
        placeholder={__("e.g., 3-5 business days", "kirki-ecommerce")}
        style={{
          padding: "var(--decom-spacing-2) var(--decom-spacing-3)",
          minHeight: "108px",
        }}
        onChange={(value) => handleOnChange(value, "description")}
      />
      <Card
        type="form"
        style={{
          border: "1px solid var(--decom-border-border)",
          borderRadius: "var(--decom-radius-rounded-md)",
        }}
      >
        <Grid columns={3}>
          <Text header={__("Weight Range (kg)", "kirki-ecommerce")} />
          <Text />
          <Text header={__("Rate", "kirki-ecommerce")} />
        </Grid>
        {ranges?.map((range, index) => (
          <Grid
            columns={3}
            key={index}
            className={`${CLASS_PREFIX}-weight-rate-delete-icon`}
          >
            <Input
              value={range.from || ""}
              type="number"
              placeholder={__("e.g. 12", "kirki-ecommerce")}
              onChange={(value) => updateRange(index, "from", value)}
            />
            <Input
              value={range.to || ""}
              type="number"
              placeholder={__("e.g. 12", "kirki-ecommerce")}
              onChange={(value) => updateRange(index, "to", value)}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <Input
                value={range.amount || ""}
                type="number"
                placeholder={__("e.g. 120Tk", "kirki-ecommerce")}
                onChange={(value) => updateRange(index, "amount", value)}
              />

              {index !== 0 && (
                <Button
                  type="secondary"
                  icon={<TrashIcon />}
                  style={{ padding: "var(--decom-spacing-1)" }}
                  // className={"trash-icon"}
                  onClick={() => removeRange(index)}
                />
              )}
            </div>
          </Grid>
        ))}
        <Button
          type={"blank"}
          text={__("Add Another Range", "kirki-ecommerce")}
          leftIcon={<PlusIcon />}
          onClick={addRange}
        />
      </Card>

      <Checkbox
        value={dataObj?.["is_taxable"]}
        label={__("Tax applies to the shipping charge", "kirki-ecommerce")}
        onChange={(value) => handleOnChange(value, "is_taxable")}
      />
      <Checkbox
        value={hasFreeShipping}
        label={__(
          "Offer free shipping when a customer buys over a certain amount",
          "kirki-ecommerce"
        )}
        onChange={() => setHasFreeShipping(!hasFreeShipping)}
      />
      {hasFreeShipping && (
        <Input
          label={__("Amount", "kirki-ecommerce")}
          placeholder={__("$0.00", "kirki-ecommerce")}
          type={"number"}
          value={dataObj?.amount}
          onChange={(value) => handleOnChange(value, "amount")}
        />
      )}
    </Flex>
  );
};

export default RateByWeightSettings;

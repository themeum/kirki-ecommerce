import React, { useState } from "react";
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Checkbox from '@/molecules/checkbox';
import Grid from '@/molecules/grid';
import { __ } from "@/wpi18n";

const LocalPickupSettings = (props) => {
  const { handleOnChange, dataObj } = props;
  const [hasFee, setHasFee] = useState(dataObj?.["has_fee"] || true);
  const [hasPickTime, setHasPickTime] = useState(
    dataObj?.["has_pick_time"] || false
  );

  return (
    <Flex direction="column" gap={16}>
      <Input
        label={__("Address", "kirki-ecommerce")}
        value={dataObj?.address || ""}
        placeholder={__("Google map", "kirki-ecommerce")}
        onChange={(value) => handleOnChange(value, "address")}
      />
      <Input
        type="text"
        multiline={true}
        value={dataObj?.description || ""}
        label={__("Pickup Instructions", "kirki-ecommerce")}
        placeholder={__("e.g., 3-5 business days", "kirki-ecommerce")}
        style={{
          padding: "var(--decom-spacing-2) var(--decom-spacing-3)",
          minHeight: "108px",
        }}
        onChange={(value) => handleOnChange(value, "description")}
      />
      <Checkbox
        value={hasFee}
        label={__("Has a pickup fee", "kirki-ecommerce")}
        onChange={(value) => {
          handleOnChange(value, "has_fee");
          setHasFee(!hasFee);
        }}
      />
      {hasFee && (
        <Input
          label={__("Fee", "kirki-ecommerce")}
          type={"number"}
          placeholder={__("$0.00", "kirki-ecommerce")}
          value={dataObj?.amount || ""}
          onChange={(value) => handleOnChange(value, "amount")}
        />
      )}
      <Checkbox
        value={hasPickTime}
        label={__("Pickup time available", "kirki-ecommerce")}
        onChange={(value) => {
          handleOnChange(value, "has_pick_time");
          setHasPickTime(!hasPickTime);
        }}
      />
      {hasPickTime && (
        <Grid>
          <Input
            type="time"
            value={dataObj?.["pickup_time_start"]}
            label={__("Start time", "kirki-ecommerce")}
            onChange={(value) => handleOnChange(value, "pickup_time_start")}
          />
          <Input
            type="time"
            value={dataObj?.["pickup_time_end"]}
            label={__("End time", "kirki-ecommerce")}
            onChange={(value) => handleOnChange(value, "pickup_time_end")}
          />
        </Grid>
      )}
    </Flex>
  );
};

export default LocalPickupSettings;

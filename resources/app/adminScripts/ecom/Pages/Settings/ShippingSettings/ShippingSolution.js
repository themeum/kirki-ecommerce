import React from "react";
import { Card, Text, Grid, Button } from "../../../molecules";
import { ShippoIcon, EasyShipIcon } from "icons";
import { __ } from "wpi18n";

const ShippingSolution = () => {
  return (
    <>
      <Card type="large">
        <Text
          type="primary"
          header={__("Shipping Solution", "kirki-ecommerce")}
          subHeader="Used to create shipping rates for different product groups, like heavy items needing higher fees."
        />

        <Grid>
          <Button
            type="outlined"
            size="fullWidth"
            icon={<ShippoIcon />}
            style={{ padding: "20px 0" }}
          />
          <Button
            type="outlined"
            size="fullWidth"
            icon={<EasyShipIcon />}
            style={{ padding: "20px 0" }}
          />
        </Grid>
      </Card>
    </>
  );
};

export default ShippingSolution;

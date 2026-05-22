import React from "react";
import { Card, Flex, Text, Button } from "../../../molecules";
import { SimulatorIcon } from "@/Icons";
import { __ } from "@/wpi18n";
const TaxSimulator = () => {
  return (
    <div>
      <Card type="large">
        <Flex gap={8}>
          <Flex gap={12} direction="column" style={{ width: "55%" }}>
            <Flex gap={6} direction="column">
              <Text type="primary" header={__("Tax Simulator", "kirki-ecommerce")} />
              <Text
                type="secondary"
                subHeader={__(
                  "Test your real-world shipping outcomes instantly — no guesswork needed.",
                  "kirki-ecommerce"
                )}
              />
            </Flex>
            <Button
              type="tartiary"
              size="small"
              text="Try Simulator"
              leftIcon={<SimulatorIcon />}
            />
          </Flex>
          <Card type="tartiary" style={{ width: "45%" }}></Card>
        </Flex>
      </Card>
    </div>
  );
};

export default TaxSimulator;

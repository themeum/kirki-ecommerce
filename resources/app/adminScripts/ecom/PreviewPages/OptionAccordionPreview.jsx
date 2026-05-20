import React from "react";
import OptionAccordion from "../components/OptionAccordion";
import { ActionGroup, Button, ToggleButton } from "../molecules";
import { ShowMoreIcon, LocationIcon } from "icons";
import GroupOptionCardPreview from "./GroupOptionCardPreview";

const OptionAccordionPreview = () => {
  const rightActions = (
    <ActionGroup gap={8} style={{ alignItems: "center" }}>
      <ToggleButton value={true} />
      <Button
        type="ghost"
        size="small"
        icon={<ShowMoreIcon />}
        style={{ transform: "rotate(90deg)" }}
      />
    </ActionGroup>
  );

  return (
    <div>
      <OptionAccordion
        header={"Zone 1- EU Countries"}
        subHeader={"3 Regions, 2 Shipping Methods"}
        leftIcon={<LocationIcon height={20} width={20} />}
        rightActions={rightActions}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
      <OptionAccordion
        header={"Zone 2- South Asia"}
        subHeader={"3 Regions, 2 Shipping Methods"}
        leftIcon={<LocationIcon height={20} width={20} />}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
      <OptionAccordion
        header={"Zone 3- International Shipping"}
        subHeader={"3 Regions, 2 Shipping Methods"}
        leftIcon={<LocationIcon height={20} width={20} />}
        rightActions={rightActions}
      >
        <GroupOptionCardPreview />
      </OptionAccordion>
    </div>
  );
};

export default OptionAccordionPreview;

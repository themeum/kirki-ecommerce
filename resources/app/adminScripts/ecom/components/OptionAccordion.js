import React from "react";
import { __ } from "wpi18n";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Text,
  Card,
  Badge,
} from "../molecules";
import { CLASS_PREFIX } from "conf";

const OptionAccordion = (props) => {
  const {
    header,
    subHeader,
    leftIcon,
    children,
    rightActions = null,
    variant,
    state = true,
  } = props;
  const variants = {
    shipping: `${CLASS_PREFIX}-option-accordion--shipping`,
    inactive: `${CLASS_PREFIX}-option-accordion--inactive`,
  };

  const variantClass = [variants[variant], state === false && variants.inactive]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        borderRadius: "var(--decom-radius-rounded-xl)",
        border: "1px solid var(--decom-icon-inverse)",
      }}
    >
      <Accordion
        style={{ width: "100%" }}
        hideSeparator={true}
        hasBottomSpace={false}
        rightActions={rightActions}
      >
        <AccordionItem>
          <AccordionTrigger
            className={`${variantClass} ${CLASS_PREFIX}-option-accordion-trigger`}
            style={{ padding: "var(--decom-spacing-3) var(--decom-spacing-4)" }}
            gap={16}
          >
            <Text
              header={header}
              subHeader={subHeader}
              style={{ gap: "6px" }}
              leftIcon={leftIcon}
              badge={
                !state && (
                  <Badge text={__("Inactive", "kirki-ecommerce")} type="trashed" />
                )
              }
              type={!state ? "disabled" : "secondary"}
            />
          </AccordionTrigger>
          <AccordionContent>
            <Card
              type="dark"
              style={{
                borderRadius:
                  "var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-lg) var(--decom-radius-rounded-lg)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {children}
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default OptionAccordion;

import React from "react";
import {
  ActionGroup,
  Card,
  RichText,
  Text,
  ToggleButton,
} from "../../../molecules";
import { __ } from "@/wpi18n";

const LegalInfo = (props) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <>
      <Card type="large">
        <Text
          type="primary"
          header={__("Legal Information", "kirki-ecommerce")}
          subHeader={__(
            "show or hide your terms & conditions and privacy policy on the checkout page",
            "kirki-ecommerce"
          )}
          style={{ gap: "var(--decom-spacing-f3)" }}
        />
        <Card
          type="form"
          style={{
            border: "1px solid var(--decom-border-border)",
            borderRadius: "var(--decom-radius-rounded-lg)",
          }}
        >
          <ActionGroup
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Text
              type="secondary"
              header={__("Show Terms and Conditions", "kirki-ecommerce")}
            />
            <ToggleButton
              value={dataObj?.is_terms_and_conditions_visible}
              onChange={(value) =>
                handleOnChange(value, "is_terms_and_conditions_visible")
              }
            />
          </ActionGroup>
          <RichText
            value={dataObj?.terms_and_conditions_content}
            onChange={(content) =>
              handleOnChange(content, "terms_and_conditions_content")
            }
            placeholder={__("Privacy & Policy . Terms & Conditions", "kirki-ecommerce")}
            error={errors["data.terms_and_conditions_content"]}
          />
        </Card>
        <Card
          type="form"
          style={{
            border: "1px solid var(--decom-border-border)",
            borderRadius: "var(--decom-radius-rounded-lg)",
          }}
        >
          <ActionGroup
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Text
              type="secondary"
              header={__("Show Privacy Policy", "kirki-ecommerce")}
            />
            <ToggleButton
              value={dataObj?.is_privacy_policy_visible}
              onChange={(value) =>
                handleOnChange(value, "is_privacy_policy_visible")
              }
            />
          </ActionGroup>
          <RichText
            value={dataObj?.privacy_policy_content}
            onChange={(content) =>
              handleOnChange(content, "privacy_policy_content")
            }
            placeholder={__("Privacy & Policy . Terms & Conditions", "kirki-ecommerce")}
            error={errors["data.privacy_policy_content"]}
          />
        </Card>
      </Card>
    </>
  );
};

export default LegalInfo;

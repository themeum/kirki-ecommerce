import React from "react";
import { Button, Card, Flex, Text } from "../../molecules";
import { CLASS_PREFIX } from "@/conf";
import { DropdownSubmenuIcon } from "@/Icons";
import { useNavigate } from "react-router";

export const SettingsItem = (props) => {
  const { link, header, subHeader, icon } = props;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(link);
  };
  return (
    <>
      <Card
        style={{
          padding: "var(--decom-spacing-2) var(--decom-spacing-3)",
        }}
        link={link}
      >
        <Flex gap={8} style={{ position: "relative" }}>
          <div className={`${CLASS_PREFIX}-settings-card-identifier`}></div>
          <span style={{ marginTop: "var(--decom-spacing-1)" }}>{icon}</span>
          <Text
            header={header}
            subHeader={subHeader}
            type="secondary"
            style={{ gap: 0 }}
          />
        </Flex>
        <Flex>
          <Button
            className={`${CLASS_PREFIX}-settings-card-button`}
            style={{
              backgroundColor: "var(--decom-background-bg-fill-secondary)",
            }}
            icon={<DropdownSubmenuIcon />}
            size={"xsm"}
            onClick={handleClick}
          />
        </Flex>
      </Card>
    </>
  );
};

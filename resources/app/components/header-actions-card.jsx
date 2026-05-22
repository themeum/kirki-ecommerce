import React from "react";
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import { PlusIcon } from "@/icons";
import { __ } from "@/wpi18n";
import DropdownButton from '@/components/dropdown-button';

const HeaderActionsCard = (props) => {
  const {
    header,
    subHeader,
    buttonText,
    onAdd,
    hideButton = false,
    dropDownButton = false,
    handleOptionSelect = () => {},
  } = props;
  return (
    <>
      <Flex direction="column" gap={4}>
        <Flex style={{ alignItems: "center" }}>
          <Text
            type="primary"
            header={header}
            style={{ gap: "var(--decom-spacing-3)" }}
          />
          {!hideButton && (
            <ActionGroup>
              {dropDownButton ? (
                <DropdownButton
                  buttonProps={{
                    text: buttonText,
                    size: "small",
                    type: "secondary",
                    leftIcon: <PlusIcon />,
                    onClick: onAdd,
                  }}
                  size="small"
                  options={[
                    {
                      title: __("Color", "kirki-ecommerce"),
                      value: "color",
                    },
                    {
                      title: __("List", "kirki-ecommerce"),
                      value: "list",
                    },
                  ]}
                  onOptionSelect={(value) => handleOptionSelect(value)}
                />
              ) : (
                <Button
                  text={buttonText}
                  size="small"
                  type="secondary"
                  leftIcon={<PlusIcon />}
                  onClick={onAdd}
                />
              )}
            </ActionGroup>
          )}
        </Flex>
        <Text type="primary" subHeader={subHeader} />
      </Flex>
    </>
  );
};

export default HeaderActionsCard;

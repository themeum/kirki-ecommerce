import React, { useState } from "react";
import { CLASS_PREFIX } from "conf";
import {
  Card,
  Flex,
  Text,
  Badge,
  ToggleButton,
  ActionGroup,
  Button,
} from "../molecules";
import DropdownButton from "./DropdownButton";
import { EditPenIcon, TrashIcon, ShowMoreIcon } from "icons";
import { __ } from "wpi18n";

// dataArr has properties = [name, subText, selected, is_enabled="active/inactive", rightIcon, rightText, badge1, badge2, icon]

const GroupOptionCard = (props) => {
  const {
    dataArr = [],
    handleToggleItem = false,
    handleDeleteItem = false,
    handleEditItem = false,
    handleMoreOption = false,
    actionsArray = [],
    handleAction = false,
  } = props;
  let dataLength = 0;
  if (dataArr) dataLength = dataArr?.length;

  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <div>
      {/* traverse the dataArray */}
      {dataArr.map((item, index) => (
        <Card
          type="inner"
          key={index}
          className={`${CLASS_PREFIX}-option-card ${CLASS_PREFIX}-hover-parent 
          ${
            activeIndex === index ? `${CLASS_PREFIX}-option-card-active` : ""
          } ${
            dataLength > 1
              ? `${CLASS_PREFIX}-option-card-border-radius`
              : `${CLASS_PREFIX}-option-card-border-radius-single`
          }`}
          style={{
            maxHeight: "44px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Flex
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Flex
              style={{
                alignItems: "center",
                minHeight: "36px",
              }}
              gap={8}
            >
              <Text
                header={item?.name ?? ""}
                leftIcon={item?.icon}
                style={{ fontWeight: "500" }}
                type="xsm"
              />
              {item?.subText && (
                <Text
                  style={{ color: "var(--decom-text-text-subdued)" }}
                  header={item?.subText ?? ""}
                  type="xsm"
                />
              )}
              {item?.badge1 && (
                <Badge
                  text={item.badge1}
                  type={item?.selected === true ? "requested" : "default"}
                />
              )}
              {item?.badge2 && <Badge text={item.badge2} type="default" />}
              {(item?.is_default || item?.is_base) && (
                <Badge
                  text={
                    item?.is_default
                      ? __("Default", "kirki-ecommerce")
                      : __("Base currency", "kirki-ecommerce")
                  }
                  type={"refunded"}
                />
              )}
              {item?.is_enabled === false ? (
                <Badge text={__("Inactive", "kirki-ecommerce")} type="trashed" />
              ) : (
                ""
              )}
            </Flex>
            {(item?.rightIcon || item?.rightText) && (
              <Flex
                className={`${CLASS_PREFIX}-group-option-card-right-text`}
                gap={12}
              >
                {item.rightIcon && item.rightIcon}
                {item.rightText && (
                  <Text subHeader={item?.rightText} type="secondary" />
                )}
              </Flex>
            )}
            <ActionGroup className={`${CLASS_PREFIX}-card-actions`}>
              {handleToggleItem && !item?.is_toggle_disabled && (
                <ToggleButton
                  onChange={() => handleToggleItem(item)}
                  value={item?.is_enabled}
                />
              )}
              {handleDeleteItem && (
                <Button
                  type="secondary"
                  icon={<TrashIcon />}
                  className={`${CLASS_PREFIX}-group-option-card-icon ${
                    item?.is_delete_disabled
                      ? `${CLASS_PREFIX}-icon-disabled`
                      : ""
                  }`}
                  onClick={
                    item?.is_delete_disabled
                      ? undefined
                      : () => handleDeleteItem(item)
                  }
                />
              )}
              {handleEditItem && (
                <Button
                  type="secondary"
                  icon={<EditPenIcon />}
                  onClick={() => handleEditItem(item)}
                  className={`${CLASS_PREFIX}-group-option-card-icon`}
                />
              )}
              {handleMoreOption && !item?.is_action_disabled && (
                <DropdownButton
                  buttonProps={{
                    type: "secondary",
                    style: { transform: "rotate(90deg)" },
                    icon: <ShowMoreIcon />,
                    className: `${CLASS_PREFIX}-group-option-card-icon `,
                  }}
                  dropdownStyle={{ minWidth: "170px" }}
                  size="small"
                  hasLeftIcon={false}
                  options={item?.actionsArray || actionsArray}
                  onOptionToggle={(value) => {
                    value === true
                      ? setActiveIndex(index)
                      : setActiveIndex(null);
                  }}
                  onOptionSelect={(action) => handleAction(action, item)}
                />
              )}
            </ActionGroup>
          </Flex>
        </Card>
      ))}
    </div>
  );
};

export default GroupOptionCard;

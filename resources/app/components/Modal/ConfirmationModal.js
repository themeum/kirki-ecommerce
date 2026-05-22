import React from "react";
import {
  Button,
  Text,
  Popover,
  PopoverBody,
  PopoverHeader,
  Flex,
} from "../../molecules";
import { InfoIcon, TrashIcon } from "@/Icons";
import { __ } from "@/wpi18n";

export const ConfirmationModal = (props) => {
  const { variant = "default", title, subtitle, onConfirm, onCancel } = props;

  const VARIANT_UI = {
    default: {
      confirmText: __("Leave", "kirki-ecommerce"),
      type: "primary",
      icon: <InfoIcon />,
      iconBg: "#EBE8FE",
    },
    warning: {
      confirmText: __("Proceed", "kirki-ecommerce"),
      type: "secondary",
      icon: <InfoIcon />,
      iconBg: "#EBE8FE",
    },
    delete: {
      confirmText: __("Delete", "kirki-ecommerce"),
      type: "destructive",
      icon: <TrashIcon style={{ height: 20, width: 20 }} />,
      iconBg: "#FFE5E4",
    },
  };

  const ui = VARIANT_UI[variant];

  const finalTitle =
    variant === "default" ? __("Unsaved changes", "kirki-ecommerce") : title ?? "";

  const finalSubtitle =
    variant === "default"
      ? __("You have unsaved changes. Leave anyway?", "kirki-ecommerce")
      : subtitle ?? "";

  return (
    <Popover darkBackdrop isOpen style={{ width: 400 }}>
      <PopoverHeader onClose={onCancel} />

      <PopoverBody
        style={{
          alignItems: "center",
          padding: 0,
          textAlign: "center",
        }}
      >
        <span
          style={{
            height: 40,
            width: 40,
            background: ui.iconBg,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {ui.icon}
        </span>

        {!!finalTitle && (
          <Text type="primary" header={finalTitle} style={{ fontSize: 20 }} />
        )}

        {!!finalSubtitle && <span>{finalSubtitle}</span>}

        <Flex
          style={{
            padding: "24px 8px",
            gap: 8,
            justifyContent: "space-between",
            width: "80%",
          }}
        >
          <Button
            size="fullWidth"
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            onClick={onCancel}
          />

          <Button
            size="fullWidth"
            type={ui.type}
            text={ui.confirmText}
            onClick={onConfirm}
          />
        </Flex>
      </PopoverBody>
    </Popover>
  );
};

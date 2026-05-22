import React from "react";
import ActionGroup from '@/molecules/action-group';
import ToggleButton from '@/molecules/toggle-button';
import DropdownButton from '@/components/dropdown-button';
import { ShowMoreIcon, EditIcon, TrashIcon } from "@/icons";
import { useOutletContext, useNavigate } from "react-router";
import { __ } from "@/wpi18n";
import { setUnsavedDataStatus } from "../utils";

const ShippingZoneActions = ({ item, onToggle, onDelete }) => {
  const { confirmAction } = useOutletContext();
  const navigate = useNavigate();
  const handleEditAndDelete = (action, item) => {
    if (action === "edit") {
      confirmAction({
        action: () => navigate(`/settings/shipping/zone/${item.id}`),
      });
    } else {
      setUnsavedDataStatus(true);
      confirmAction({
        action: () => onDelete(item),
        otherProps: {
          variant: "delete",
          force: true,
          title: __("Delete shipping zone?", "kirki-ecommerce"),
          subtitle: __(
            "Are you sure you want to delete this zone? This action cannot be undone.",
            "kirki-ecommerce"
          ),
        },
      });
    }
  };
  return (
    <ActionGroup gap={8} style={{ alignItems: "center" }}>
      <ToggleButton value={item?.is_enabled} onChange={() => onToggle(item)} />
      <DropdownButton
        buttonProps={{
          style: {
            transform: "rotate(90deg)",
            padding: "var(--decom-spacing-2)",
          },
          icon: <ShowMoreIcon />,
        }}
        options={[
          { title: __("Edit", "kirki-ecommerce"), value: "edit", icon: <EditIcon /> },
          {
            title: __("Delete", "kirki-ecommerce"),
            value: "delete",
            icon: <TrashIcon />,
          },
        ]}
        onOptionSelect={(action) => handleEditAndDelete(action, item)}
      />
    </ActionGroup>
  );
};

export default ShippingZoneActions;

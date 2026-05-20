import React, { useMemo } from "react";
import { Card, Flex } from "../../../../molecules";
import { BoxOpenIcon } from "icons";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import { useNavigate } from "react-router";
import { saveShippingZones, shippingMethodIconMap } from "../utils";
import { dispatchToastMessage } from "../../../utils";
import { __ } from "wpi18n";

export const ShippingMethod = (props) => {
  const navigate = useNavigate();

  const {
    from = "",
    shippingSettingsData,
    shippingMethodList,
    setShippingZonesObj,
    shippingZonesObj,
  } = props;

  const shippingMethodListWithIcon = useMemo(() => {
    return (shippingMethodList || []).map((method) => ({
      ...method,
      icon: shippingMethodIconMap[method.type] || null,
    }));
  }, [shippingMethodList]);

  const handleDeleteMethodItem = (item) => {
    const originalZones = [...shippingZonesObj];

    const updatedZones = shippingZonesObj.map((zone) => {
      if (!zone.shipping_methods?.some((m) => m.id === item.id)) return zone;
      return {
        ...zone,
        shipping_methods: zone.shipping_methods.filter((m) => m.id !== item.id),
      };
    });
    setShippingZonesObj(updatedZones);
    dispatchToastMessage("delete", {
      title: __("Shipping method deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setShippingZonesObj(originalZones);
      },
      onSuccess: async () => {
        await saveShippingZones({
          zones: updatedZones,
          from: "delete",
          shippingSettingsData,
        });
      },
    });
  };

  const handleToggleMethodItem = async (item) => {
    const updatedZones = shippingZonesObj.map((zone) => {
      if (!zone.shipping_methods?.some((m) => m.id === item.id)) return zone;
      return {
        ...zone,
        shipping_methods: zone.shipping_methods.map((m) =>
          m.id === item.id ? { ...m, is_enabled: !m.is_enabled } : m
        ),
      };
    });

    setShippingZonesObj(updatedZones);
    await saveShippingZones({
      zones: updatedZones,
      from: "edit",
      shippingSettingsData,
      toastMessage: __("Shipping method active status updated", "kirki-ecommerce"),
    });
  };

  const handleEditDeliveryMethod = (item) => {
    navigate(
      `/settings/shipping/delivery-method?methodId=${item.id}&zoneId=${item.zoneId}`
    );
  };

  return (
    <div>
      {from === "edit_zone" ? (
        <div style={{ marginTop: "var(--decom-spacing-3)" }}>
          <GroupOptionCard
            dataArr={shippingMethodList}
            handleDeleteItem={handleDeleteMethodItem}
            handleEditItem={handleEditDeliveryMethod}
            handleToggleItem={handleToggleMethodItem}
          />
        </div>
      ) : (
        <Card type="large">
          <HeaderActionsCard
            header={__("Shipping Methods", "kirki-ecommerce")}
            subHeader={__(
              "Used to create shipping rates for different product groups, like heavy items needing higher fees.",
              "kirki-ecommerce"
            )}
            buttonText={__("Add Method", "kirki-ecommerce")}
            onAdd={() => navigate(`/settings/shipping/delivery-method`)}
          />

          {!shippingMethodList?.length ? (
            <Card
              type="innerDark"
              style={{
                padding: "var(--decom-spacing-9) var(--decom-spacing-0)",
              }}
            >
              <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
                <BoxOpenIcon />
                <span style={{ color: "var(--decom-text-text-subdued)" }}>
                  {__("Added shipping profiles will appear here", "kirki-ecommerce")}
                </span>
              </Flex>
            </Card>
          ) : (
            <GroupOptionCard
              dataArr={shippingMethodListWithIcon}
              handleDeleteItem={handleDeleteMethodItem}
              handleEditItem={handleEditDeliveryMethod}
            />
          )}
        </Card>
      )}
    </div>
  );
};

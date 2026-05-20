export const resolveDestinationRegion = ({
  shippingSettingsData,
  methodID,
  setSelectedRegion,
}) => {
  if (!shippingSettingsData?.shipping_zones) return;

  const zone = methodID
    ? shippingSettingsData.shipping_zones.find((zone) =>
        zone.shipping_methods?.some((m) => m.id === methodID)
      )
    : shippingSettingsData.shipping_zones.find(
        (zone) => zone.id === activeZoneId
      );

  setSelectedRegion(zone?.regions);
};

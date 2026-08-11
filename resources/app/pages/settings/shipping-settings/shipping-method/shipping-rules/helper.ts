type ResolveDestinationRegionParams = {
  shippingSettingsData: {
    shipping_zones?: Array<{
      id: string | number;
      regions?: unknown;
      shipping_methods?: Array<{ id: string | number }>;
    }>;
  } | null | undefined;
  methodID: string | number | null | undefined;
  setSelectedRegion: (regions: unknown) => void;
  activeZoneId?: string | number | null;
};

export const resolveDestinationRegion = ({
  shippingSettingsData,
  methodID,
  setSelectedRegion,
  activeZoneId,
}: ResolveDestinationRegionParams): void => {
  if (!shippingSettingsData?.shipping_zones) {
    return;
  }

  const zone = methodID
    ? shippingSettingsData.shipping_zones.find((zone) =>
        zone.shipping_methods?.some((m) => m.id === methodID),
      )
    : shippingSettingsData.shipping_zones.find(
        (zone) => zone.id === activeZoneId,
      );

  setSelectedRegion(zone?.regions);
};

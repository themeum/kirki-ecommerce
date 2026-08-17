import { getShippingMethodRightText, getShippingMethodSubText, shippingMethodIconMap } from '@/features/settings/shipping/lib/utils';
import type { ShippingMethodData, ShippingZone } from '@/features/settings/shipping/types';

const toggleMethod = (
  zones: ShippingZone[],
  zoneId: string | number,
  methodId: string | number,
): ShippingZone[] =>
  zones.map((zone) => {
    if (zone.id !== zoneId) {
      return zone;
    }
    return {
      ...zone,
      shipping_methods: (zone.shipping_methods || []).map((item) =>
        item.id === methodId
          ? { ...item, is_enabled: !(item.is_enabled ?? true) }
          : item,
      ),
    };
  });

const removeZone = (
  zones: ShippingZone[],
  zoneId: string | number,
): ShippingZone[] => zones.filter((zone) => zone.id !== zoneId);

/**
 * The row view model shown for a zone's methods: each method enriched with
 * its icon, sub/right text, and the zone id it belongs to (so a row-level
 * handler can identify which zone to update).
 */
const getShippingMethodData = (
  zones: ShippingZone[],
  zoneId: string | number,
): ShippingMethodData[] => {
  const selectedZone = zones.find((zone) => zone.id === zoneId);
  if (!selectedZone) {
    return [];
  }

  return (selectedZone.shipping_methods || []).map((method) => ({
    ...method,
    icon: shippingMethodIconMap[method.type] || null,
    subText: getShippingMethodSubText(method),
    rightText: getShippingMethodRightText(method),
    zoneId,
  }));
};

export { getShippingMethodData, removeZone, toggleMethod };

import type { ShippingZone } from '@/pages/settings/shipping-settings/utils';

type ShippingProfileUsage = {
  ruleCount: number;
  zoneCount: number;
};

const getProfileUsage = (
  profileName: string,
  zones: ShippingZone[],
): ShippingProfileUsage => {
  const zonesUsingProfile = new Set<string | number>();
  let ruleCount = 0;

  zones.forEach((zone) => {
    zone.shipping_methods?.forEach((method) => {
      method.shipping_rules?.forEach((rule) => {
        const referencesProfile = rule.conditions?.some(
          (condition) =>
            condition.type === 'shipping_profile' &&
            condition.value === profileName,
        );

        if (referencesProfile) {
          ruleCount += 1;
          zonesUsingProfile.add(zone.id);
        }
      });
    });
  });

  return { ruleCount, zoneCount: zonesUsingProfile.size };
};

export { getProfileUsage };
export type { ShippingProfileUsage };

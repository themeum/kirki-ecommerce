import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { BulkEditProfileOption } from '@/features/bulk-edit/types';
import { useTaxProfilesQuery } from '@/features/settings';
import { useShippingProfilesQuery } from '@/features/settings';

type BulkEditOptionsContextValue = {
  taxProfileOptions: BulkEditProfileOption[];
  shippingProfileOptions: BulkEditProfileOption[];
};

const BulkEditOptionsContext = createContext<BulkEditOptionsContextValue>({
  taxProfileOptions: [],
  shippingProfileOptions: [],
});

/**
 * Fetches tax and shipping profile options once for the whole grid — a
 * per-row query here would be a thousand duplicate requests at catalogue scale.
 */
const BulkEditOptionsProvider = ({ children }: { children: ReactNode }) => {
  const { data: taxProfiles } = useTaxProfilesQuery({ limit: -1 });
  const { data: shippingProfiles } = useShippingProfilesQuery({ limit: -1 });

  const value = useMemo<BulkEditOptionsContextValue>(
    () => ({
      taxProfileOptions: (taxProfiles ?? []).map((profile) => ({
        label: profile.name,
        value: profile.id,
      })),
      shippingProfileOptions: (shippingProfiles ?? []).map((profile) => ({
        label: profile.name,
        value: profile.id,
      })),
    }),
    [taxProfiles, shippingProfiles],
  );

  return <BulkEditOptionsContext.Provider value={value}>{children}</BulkEditOptionsContext.Provider>;
};

BulkEditOptionsProvider.displayName = 'BulkEditOptionsProvider';

const useBulkEditOptions = (): BulkEditOptionsContextValue => {
  return useContext(BulkEditOptionsContext);
};

export { BulkEditOptionsProvider, useBulkEditOptions };

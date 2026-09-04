import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import { useInvalidateTaxSettings } from '@/features/settings/tax/shared/hooks/use-invalidate-tax-settings';
import type { TaxRegion } from '@/features/settings/tax/shared/lib/utils';
import {
  type TaxSettingsFormPayload,
  TaxSettingsFormSchema,
} from '@/features/settings/tax/shared/schemas/forms/tax-settings-form';
import { pickFormValues } from '@/libs/zod';
import { toastMutationError } from '@/services/helpers';
import { updateSettings, useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';

type UseTaxRegionSettingsResult = {
  loaded: boolean;
  regions: TaxRegion[];
  setRegions: Dispatch<SetStateAction<TaxRegion[]>>;
  isSaving: boolean;
  saveRegions: (updatedRegions: TaxRegion[], options?: { silent?: boolean }) => Promise<void>;
};

/**
 * Owns the "load tax settings → merge a region → PUT the whole blob back"
 * flow shared by every region editor. It rethrows a save failure rather than
 * handling it, so each editor keeps reporting server-side validation errors
 * on its own form. The delete path (`{ silent: true }`) is the exception:
 * it persists immediately via a direct `updateSettings` call, clears the
 * unsaved-changes marker, refreshes the tax settings, and reports any
 * failure as a toast instead of rethrowing.
 */
export const useTaxRegionSettings = (): UseTaxRegionSettingsResult => {
  const invalidateTaxSettings = useInvalidateTaxSettings();
  const [regions, setRegions] = useState<TaxRegion[]>([]);

  const { data: taxSettingsData, isLoading } = useSettingsQuery('tax');
  const { mutateAsync: saveSettings, isPending: isSaving } = useUpdateSettingsMutation<'tax'>();

  const loaded = !isLoading && Boolean(taxSettingsData);

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setRegions(taxSettingsData.tax_regions);
    }
  }, [taxSettingsData]);

  const saveRegions = async (updatedRegions: TaxRegion[], options: { silent?: boolean } = {}) => {
    const currentTaxSettings = TaxSettingsFormSchema.parse(
      pickFormValues(TaxSettingsFormSchema, taxSettingsData ?? {}),
    );
    const payload: TaxSettingsFormPayload = {
      ...currentTaxSettings,
      tax_regions: updatedRegions,
    };

    if (options.silent) {
      try {
        await updateSettings({ key: 'tax', data: payload });
        setUnsavedDataStatus(false);
        invalidateTaxSettings();
      } catch (error) {
        toastMutationError(error);
      }
      return;
    }

    await saveSettings({ key: 'tax', data: payload });
  };

  return { loaded, regions, setRegions, isSaving, saveRegions };
};

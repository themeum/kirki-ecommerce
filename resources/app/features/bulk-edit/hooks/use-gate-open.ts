import { type FieldPath, useFormContext, useWatch } from 'react-hook-form';

import type { BulkEditFormValues } from '@/features/bulk-edit/types';

/**
 * Watches a row's gating field (e.g. `track_inventory`) so a gated cell
 * knows whether to render its control or a placeholder. When the column has
 * no gate, watches `id` instead of skipping the hook call — `useWatch` must
 * run on every render regardless, and `id` never changes so the cost is nil.
 */
const useGateOpen = (rowIndex: number, gatedBy?: string): boolean => {
  const { control } = useFormContext<BulkEditFormValues>();
  const name = `variants.${rowIndex}.${gatedBy ?? 'id'}` as FieldPath<BulkEditFormValues>;
  const value = useWatch({ control, name });
  return gatedBy ? Boolean(value) : true;
};

export { useGateOpen };

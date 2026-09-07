import type { TaxRegionStrategy } from '@/features/settings/tax/shared/contracts/tax-region-strategy';

import {
  buildGeneralRegionEditLink,
  createGeneralRegion,
  resolveGeneralRegionMeta,
  resolveGeneralRegionSummary,
} from './lib/region-display';
import { generalRoutes } from './routes';

export const generalTaxRegionStrategy: TaxRegionStrategy = {
  key: 'DEFAULT',
  createRegion: createGeneralRegion,
  resolveMeta: resolveGeneralRegionMeta,
  resolveSummary: resolveGeneralRegionSummary,
  buildEditLink: buildGeneralRegionEditLink,
  routes: generalRoutes,
};

import type { TaxRegionStrategy } from '@/features/settings/tax/shared/contracts/tax-region-strategy';

import {
  buildGeneralRegionEditLink,
  createGeneralRegion,
  resolveGeneralRegionBadges,
  resolveGeneralRegionMeta,
  resolveGeneralRegionRateLabel,
} from './lib/region-display';
import { generalRoutes } from './routes';

export const generalTaxRegionStrategy: TaxRegionStrategy = {
  key: 'DEFAULT',
  createRegion: createGeneralRegion,
  resolveMeta: resolveGeneralRegionMeta,
  resolveBadges: resolveGeneralRegionBadges,
  resolveRateLabel: resolveGeneralRegionRateLabel,
  buildEditLink: buildGeneralRegionEditLink,
  routes: generalRoutes,
};

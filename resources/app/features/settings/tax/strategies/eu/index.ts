import type { TaxRegionStrategy } from '@/features/settings/tax/shared/contracts/tax-region-strategy';

import {
  buildEuRegionEditLink,
  createEuRegion,
  resolveEuRegionBadges,
  resolveEuRegionMeta,
  resolveEuRegionRateLabel,
} from './lib/region-display';
import { euRoutes } from './routes';

export const euTaxRegionStrategy: TaxRegionStrategy = {
  key: 'EU',
  createRegion: createEuRegion,
  resolveMeta: resolveEuRegionMeta,
  resolveBadges: resolveEuRegionBadges,
  resolveRateLabel: resolveEuRegionRateLabel,
  buildEditLink: buildEuRegionEditLink,
  routes: euRoutes,
};

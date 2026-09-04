import type { TaxRegionStrategy } from '@/features/settings/tax/shared/contracts/tax-region-strategy';

import {
  buildEuRegionEditLink,
  createEuRegion,
  resolveEuRegionMeta,
  resolveEuRegionSummary,
} from './lib/region-display';
import { euRoutes } from './routes';

export const euTaxRegionStrategy: TaxRegionStrategy = {
  key: 'EU',
  createRegion: createEuRegion,
  resolveMeta: resolveEuRegionMeta,
  resolveSummary: resolveEuRegionSummary,
  buildEditLink: buildEuRegionEditLink,
  routes: euRoutes,
};

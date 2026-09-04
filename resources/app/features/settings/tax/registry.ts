import { euTaxRegionStrategy } from '@/features/settings/tax/strategies/eu';
import { generalTaxRegionStrategy } from '@/features/settings/tax/strategies/general';

import type { TaxRegionStrategy, TaxStrategyKey } from './shared/contracts/tax-region-strategy';

/**
 * Keys must match `config/tax-strategies.php`'s `['EU' => ..., 'DEFAULT' => ...]`
 * map — the two resolve the same region code to the same kind.
 */
const taxRegionStrategies: Record<TaxStrategyKey, TaxRegionStrategy> = {
  EU: euTaxRegionStrategy,
  DEFAULT: generalTaxRegionStrategy,
};

export const resolveTaxRegionStrategy = (code: string): TaxRegionStrategy =>
  taxRegionStrategies[code as TaxStrategyKey] ?? taxRegionStrategies.DEFAULT;

export const taxRegionStrategyList: TaxRegionStrategy[] = Object.values(taxRegionStrategies);

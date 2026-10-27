import type { ReactNode } from 'react';

import type { VariantFieldPrefix } from '@/features/products/components/variant-sections/resolve-field-name';
import { VariantFieldScopeContext } from '@/features/products/components/variant-sections/use-variant-field';

type VariantFieldScopeProps = {
  prefix?: VariantFieldPrefix;
  children: ReactNode;
};

/**
 * Tells the variant cards nested inside it where the variant's fields live in
 * the host form: at its root, or under one entry of the product form's
 * `variants` array.
 */
const VariantFieldScope = ({ prefix = '', children }: VariantFieldScopeProps) => {
  return (
    <VariantFieldScopeContext.Provider value={prefix}>{children}</VariantFieldScopeContext.Provider>
  );
};

VariantFieldScope.displayName = 'VariantFieldScope';

export default VariantFieldScope;

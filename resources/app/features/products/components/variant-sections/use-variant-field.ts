import { createContext, useCallback, useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  resolveVariantFieldName,
  type VariantFieldPrefix,
} from '@/features/products/components/variant-sections/resolve-field-name';
import type {
  VariantFieldKey,
  VariantFieldsInput,
} from '@/features/products/schemas/forms/variant-fields';

const VariantFieldScopeContext = createContext<VariantFieldPrefix>('');

const useVariantField = () => {
  const prefix = useContext(VariantFieldScopeContext);

  return useCallback((key: VariantFieldKey) => resolveVariantFieldName(prefix, key), [prefix]);
};

/**
 * Watches a named subset of the scoped variant rather than the whole object:
 * under a prefix the variant is one slice of a much larger product form, and
 * subscribing to all of it would re-render on every unrelated product edit.
 */
const useVariantValues = <Key extends VariantFieldKey>(
  keys: readonly Key[],
): Pick<VariantFieldsInput, Key> => {
  const field = useVariantField();
  const { control } = useFormContext();
  const values = useWatch({ control, name: keys.map((key) => field(key)) });

  return Object.fromEntries(keys.map((key, index) => [key, values[index]])) as Pick<
    VariantFieldsInput,
    Key
  >;
};

export { useVariantField, useVariantValues, VariantFieldScopeContext };

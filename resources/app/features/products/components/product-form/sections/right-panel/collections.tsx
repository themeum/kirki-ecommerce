import { useFormContext } from 'react-hook-form';

import CollapsibleField from '@/components/ui/collapsible-field';
import { CollectionsField } from '@/features/collections';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { __ } from '@/wpi18n';

const Collections = () => {
  const { watch, setValue } = useFormContext<ProductFormInput>();
  const collections = watch('collections');

  return (
    <CollapsibleField
      addLabel={__('Collections', 'kirki-ecommerce')}
      label={__('Collections', 'kirki-ecommerce')}
      hasValue={(collections?.length ?? 0) > 0}
      removeLabel={__('Remove collections', 'kirki-ecommerce')}
      labelFor="collections"
      onRemove={() => {
        setValue('collections', [], { shouldDirty: true, shouldValidate: true });
      }}
    >
      <CollectionsField name="collections" />
    </CollapsibleField>
  );
};

Collections.displayName = 'Collections';

export default Collections;

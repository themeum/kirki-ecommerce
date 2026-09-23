import { useFormContext } from 'react-hook-form';

import CollapsibleField from '@/components/ui/collapsible-field';
import { CollectionsField } from '@/features/collections';
import type { ProductFormInput } from '@/features/products/schemas/forms/product-form';
import { __ } from '@/wpi18n';

const Collections = () => {
  const { watch } = useFormContext<ProductFormInput>();
  const collections = watch('collections');

  return (
    <CollapsibleField
      addLabel={__('Collection', 'kirki-ecommerce')}
      hasValue={(collections?.length ?? 0) > 0}
    >
      <CollectionsField name="collections" label={__('Collections', 'kirki-ecommerce')} />
    </CollapsibleField>
  );
};

Collections.displayName = 'Collections';

export default Collections;

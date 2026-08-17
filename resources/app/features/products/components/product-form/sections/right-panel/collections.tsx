import { CollectionsField } from '@/features/collections';
import { __ } from '@/wpi18n';

const Collections = () => (
  <CollectionsField
    name="collections"
    label={__('Collections', 'kirki-ecommerce')}
  />
);

Collections.displayName = 'Collections';

export default Collections;

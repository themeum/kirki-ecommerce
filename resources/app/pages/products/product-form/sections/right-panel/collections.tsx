import CollectionsField from '@/components/form/collections-field';
import { __ } from '@/wpi18n';

const Collections = () => (
  <CollectionsField
    name="collections"
    label={__('Collections', 'kirki-ecommerce')}
  />
);

Collections.displayName = 'Collections';

export default Collections;

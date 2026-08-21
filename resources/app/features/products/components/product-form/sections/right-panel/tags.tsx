import { TagsField } from '@/features/tags';
import { __ } from '@/wpi18n';

const Tags = () => (
  <TagsField name="tags" label={__('Tags', 'kirki-ecommerce')} />
);

Tags.displayName = 'Tags';

export default Tags;

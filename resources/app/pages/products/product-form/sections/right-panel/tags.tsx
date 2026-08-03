import TagsField from '@/components/form/tags-field';
import { __ } from '@/wpi18n';

const Tags = () => (
  <TagsField name="tags" label={__('Tags', 'kirki-ecommerce')} />
);

Tags.displayName = 'Tags';

export default Tags;

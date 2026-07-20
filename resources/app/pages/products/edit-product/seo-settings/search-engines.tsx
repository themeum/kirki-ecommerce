import TextareaField from '@/components/form/textarea-field';
import TextField from '@/components/form/text-field';
import { __ } from '@/wpi18n';

const SearchEngines = () => {
  return (
    <>
      <TextField
        name="seo_title"
        label={__('Title', 'kirki-ecommerce')}
        placeholder={__('e.g. Example T-shirt', 'kirki-ecommerce')}
      />
      <TextareaField
        name="seo_description"
        label={__('Meta description', 'kirki-ecommerce')}
        placeholder={__('e.g. Cotton shirts from our store.', 'kirki-ecommerce')}
        rows={5}
      />
    </>
  );
};

SearchEngines.displayName = 'SearchEngines';

export default SearchEngines;

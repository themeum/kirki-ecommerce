import CheckboxField from '@/components/form/checkbox-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { FileTextIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

const languageOptions = [
  { value: 'english', label: 'English (Default)' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'spanish', label: 'Spanish' },
];

const CustomerOverview = () => {
  return (
    <Card
      className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <Text
        header={__('Basic Info', 'kirki-ecommerce')}
        type="primary"
        leftIcon={<FileTextIcon />}
      />
      <Card
        className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner`}
        style={{ padding: '16px' }}
      >
        <Flex direction="column" gap={16}>
          <TextField
            name="first_name"
            label={__('First Name', 'kirki-ecommerce')}
            placeholder={__('e.g. John', 'kirki-ecommerce')}
          />
          <TextField
            name="last_name"
            label={__('Last Name', 'kirki-ecommerce')}
            placeholder={__('e.g. Musk', 'kirki-ecommerce')}
          />
          <SelectField
            name="language"
            label={__('Language', 'kirki-ecommerce')}
            options={languageOptions}
            placeholder={__('English (Default)', 'kirki-ecommerce')}
          />
          <TextField
            name="email"
            label={__('Email', 'kirki-ecommerce')}
            type="email"
            placeholder={__('example@yourmail.com', 'kirki-ecommerce')}
          />
          <TextField
            name="phone"
            label={__('Phone Number', 'kirki-ecommerce')}
            type="tel"
            placeholder={__('+1 (555) 222 4354', 'kirki-ecommerce')}
          />
          <CheckboxField
            name="accepts_marketing"
            label={__(
              'Customer agrees to receive marketing emails',
              'kirki-ecommerce',
            )}
          />
        </Flex>
      </Card>
    </Card>
  );
};

CustomerOverview.displayName = 'CustomerOverview';

export default CustomerOverview;

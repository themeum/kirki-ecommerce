import CheckboxField from '@/components/form/checkbox-field';
import SelectField from '@/components/form/select-field';
import TextField from '@/components/form/text-field';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { FileTextIcon } from '@/icons';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const languageOptions = [
  { value: 'english', label: 'English (Default)' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'spanish', label: 'Spanish' },
];

const CustomerOverview = () => {
  return (
    <Card
      css={styles.formCard}
      style={{ padding: '20px', borderRadius: '20px', gap: '20px' }}
    >
      <CardHeader>
        <Text
          header={__('Basic Info', 'kirki-ecommerce')}
          type="primary"
          leftIcon={<FileTextIcon />}
        />
      </CardHeader>
      <Card css={styles.innerCard}>
        <CardContent css={styles.innerContent}>
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
        </CardContent>
      </Card>
    </Card>
  );
};

CustomerOverview.displayName = 'CustomerOverview';

export default CustomerOverview;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
};

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
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const languageOptions = [
  { value: 'english', label: 'English (Default)' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'spanish', label: 'Spanish' },
];

const CustomerOverview = () => {
  return (
    <Card css={[cardStyles.formCard, styles.roundedCard]}>
      <CardHeader>
        <Flex gap={2} align="center">
          <FileTextIcon />
          <Text weight="semibold">{__('Basic Info', 'kirki-ecommerce')}</Text>
        </Flex>
      </CardHeader>
      <Card css={cardStyles.innerCard}>
        <CardContent css={cardStyles.innerContent}>
          <Flex direction="column" gap={4}>
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
  roundedCard: scoped({
    padding: theme.spacing[5],
    borderRadius: theme.radius.xl,
    gap: theme.spacing[5],
  }),
};


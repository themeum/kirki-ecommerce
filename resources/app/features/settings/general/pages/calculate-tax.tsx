import { Percent } from 'lucide-react';

import SwitchField from '@/components/form/switch-field';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CalculateTax = () => {
  return (
    <Card
      data-search-id="general.calculate-tax"
      data-search-keywords="enable tax, disable tax, turn off tax, tax calculation"
      cssOverride={cardStyles.formCard}
    >
      <CardContent>
        <Flex gap={4} align="center">
          <div css={scoped(styles.icon)}>
            <Percent size={20} />
          </div>
          <Flex direction="column" gap={1}>
            <Text weight="semibold" variant="heading6">
              {__('Calculate tax', 'kirki-ecommerce')}
            </Text>
            <Text color="secondary">
              {__('Activating this option allows you to collect tax.', 'kirki-ecommerce')}
            </Text>
          </Flex>
          <ActionGroup>
            <SwitchField name="is_tax_calculation_enabled" />
          </ActionGroup>
        </Flex>
      </CardContent>
    </Card>
  );
};

CalculateTax.displayName = 'CalculateTax';

export default CalculateTax;

const styles = defineStyles({
  icon: {
    display: 'flex',
    color: theme.colors.icon.secondary,
  },
});

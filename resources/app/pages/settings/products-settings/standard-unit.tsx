import SelectField from '@/components/form/select-field';
import SwitchField from '@/components/form/switch-field';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { dimensionUnitList, weightUnitList } from '@/pages/settings/utils';

export const StandardUnit = () => {
  const weightOptions = weightUnitList.map((option) => ({
    label: option.title,
    value: String(option.value),
  }));

  const dimensionOptions = dimensionUnitList.map((option) => ({
    label: option.title,
    value: String(option.value),
  }));

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Standards', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Select a unit for your store's product weight and dimensions.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Flex direction="column" gap={2}>
            <Card cssOverride={styles.optionCard}>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <SelectField
                    name="weight_unit"
                    label={__('Weight unit', 'kirki-ecommerce')}
                    options={weightOptions}
                  />
                  <SelectField
                    name="dimension_unit"
                    label={__('Dimension unit', 'kirki-ecommerce')}
                    options={dimensionOptions}
                  />
                </Flex>
              </CardContent>
            </Card>
            <Card cssOverride={styles.optionCard}>
              <CardContent>
                <Flex>
                  <Flex direction="column" gap={2}>
                    <Text weight="medium">{__('Show unit price', 'kirki-ecommerce')}</Text>
                    <Text color="secondary">{__(
                      'Enable to show unit price in your products',
                      'kirki-ecommerce',
                    )}</Text>
                  </Flex>
                  <ActionGroup>
                    <SwitchField name="is_unit_price_visible" />
                  </ActionGroup>
                </Flex>
              </CardContent>
            </Card>
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

StandardUnit.displayName = 'StandardUnit';

const styles = defineStyles({
  optionCard: {
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  }
});

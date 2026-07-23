import SelectField from '@/components/form/select-field';
import SwitchField from '@/components/form/switch-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Standards', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Select a unit for your store's product weight and dimensions.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Flex direction="column" gap={8}>
            <Card css={styles.optionCard}>
              <CardContent>
                <Flex direction="column" gap={16}>
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
            <Card css={styles.optionCard}>
              <CardContent>
                <Flex>
                  <Flex direction="column" gap={6}>
                    <Text
                      type="secondary"
                      header={__('Show unit price', 'kirki-ecommerce')}
                    />
                    <Text
                      type="primary"
                      subHeader={__(
                        'Enable to show unit price in your products',
                        'kirki-ecommerce',
                      )}
                    />
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

const styles = {
  largeCard: scoped({ gap: theme.spacing['3xl'] }),
  largeContent: scoped({ paddingInline: theme.spacing['3xl'] }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  optionCard: scoped({
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  }),
};

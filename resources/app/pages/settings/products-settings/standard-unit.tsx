import SelectField from '@/components/form/select-field';
import SwitchField from '@/components/form/switch-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
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
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Text
          header={__('Standards', 'kirki-ecommerce')}
          subHeader={__(
            "Select a unit for your store's product weight and dimensions.",
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />
        <Flex direction="column" gap={8}>
          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default`}
            style={{
              borderRadius: 'var(--decom-radius-rounded-lg)',
              border: '1px solid var(--decom-border-border)',
            }}
          >
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
          </Card>
          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-default`}
            style={{
              borderRadius: 'var(--decom-radius-rounded-lg)',
              border: '1px solid var(--decom-border-border)',
            }}
          >
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
          </Card>
        </Flex>
      </Card>
    </div>
  );
};

StandardUnit.displayName = 'StandardUnit';

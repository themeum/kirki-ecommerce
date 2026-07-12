import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import ActionGroup from '@/molecules/action-group';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import type { FormErrors, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

import { dimensionUnitList, weightUnitList } from '@/pages/settings/utils';

type StandardUnitProps = {
  dataObj: SettingsSectionData;
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

export const StandardUnit = (props: StandardUnitProps) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <div>
      <Card type="large">
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
            style={{
              borderRadius: 'var(--decom-radius-rounded-lg)',
              border: '1px solid var(--decom-border-border)',
            }}
          >
            <Flex direction="column" gap={16}>
              <Select
                label={__('Weight unit', 'kirki-ecommerce')}
                value={(dataObj?.['weight_unit'] as string) || 'kg'}
                onChange={(value) => handleOnChange(value, 'weight_unit')}
                optionsArray={weightUnitList}
                error={
                  errors['data.weight_unit'] as string | boolean | undefined
                }
              />
              <Select
                label={__('Dimension unit', 'kirki-ecommerce')}
                value={(dataObj?.['dimension_unit'] as string) || 'm'}
                onChange={(value) => handleOnChange(value, 'dimension_unit')}
                optionsArray={dimensionUnitList}
                error={
                  errors['data.dimension_unit'] as string | boolean | undefined
                }
              />
            </Flex>
          </Card>
          <Card
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
                <ToggleButton
                  value={dataObj?.is_unit_price_visible as boolean}
                  onChange={(value) =>
                    handleOnChange(value, 'is_unit_price_visible')
                  }
                />
              </ActionGroup>
            </Flex>
          </Card>
        </Flex>
      </Card>
    </div>
  );
};

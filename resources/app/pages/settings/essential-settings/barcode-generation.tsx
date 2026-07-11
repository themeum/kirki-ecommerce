import CountrySelector from '@/components/country-selector';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Checkbox from '@/molecules/checkbox';
import Flex from '@/molecules/flex';
import Grid from '@/molecules/grid';
import Input from '@/molecules/input';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import type { FormErrors, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

type BarcodeGenerationProps = {
  dataObj?: SettingsSectionData;
  handleOnChange?: (value: unknown, key: string) => void;
  errors?: FormErrors;
};

const BarcodeGeneration = (_props: BarcodeGenerationProps) => {
  return (
    <div>
      <Card type="large">
        <Text
          header={__('Barcode Generation', 'kirki-ecommerce')}
          subHeader={__(
            "Select a unit for your store's product weight and dimensions.",
            'kirki-ecommerce',
          )}
          type="primary"
          style={{ gap: '12px' }}
        />

        <Card type="inner" style={{ padding: '16px' }}>
          <Flex direction="column" gap={16}>
            <Select
              label={__('Data origin', 'kirki-ecommerce')}
              optionsArray={[{ title: __('SKU', 'kirki-ecommerce'), value: 'sku' }]}
              defaultValue="sku"
            />
            <Select
              label={__('Format', 'kirki-ecommerce')}
              optionsArray={[
                {
                  title: __(
                    'Code 128 (recommended for SKU/internal use)',
                    'kirki-ecommerce',
                  ),
                  value: 'sku',
                },
              ]}
              defaultValue="sku"
            />
            <Grid>
              <Input
                label={__('Width', 'kirki-ecommerce')}
                type="number"
                placeholder={__('2.5', 'kirki-ecommerce')}
              />

              <Input
                label={__('Height', 'kirki-ecommerce')}
                type="number"
                placeholder={__('2.5', 'kirki-ecommerce')}
              />
            </Grid>

            <CountrySelector
              label={__('Country of origin', 'kirki-ecommerce')}
              onChange={() => {}}
            />

            <Checkbox
              label={__('Show human-readable text under barcode', 'kirki-ecommerce')}
            />
            <Checkbox
              label={__('Include product name above barcode', 'kirki-ecommerce')}
            />
            <Checkbox
              label={__('Include country of origin', 'kirki-ecommerce')}
            />
          </Flex>
        </Card>
        <Card
          type="innerDark"
          style={{
            height: '158px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E4E3E9',
          }}
        >
          <span>
            <img src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Screenshot-2025-07-24-at-2.29.50-PM-1.png" />
          </span>
        </Card>
        <Card type="inner" style={{ padding: '16px' }}>
          <Flex>
            <Flex direction="column" gap={6}>
              <Text
                type="secondary"
                header={__('Generate barcodes for all products', 'kirki-ecommerce')}
              />
              <Text
                type="primary"
                subHeader={__(
                  'Enable this option to let customers submit product reviews',
                  'kirki-ecommerce',
                )}
              />
            </Flex>
            <ActionGroup>
              <Button text={__('Generate', 'kirki-ecommerce')} type="secondary" />
            </ActionGroup>
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

export default BarcodeGeneration;

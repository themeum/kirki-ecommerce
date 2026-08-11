import CountrySelector from '@/components/country-selector';
import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import type { ProductSettings } from '@/schemas/catalog/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import type { FormErrors } from '@/types';
import { __ } from '@/wpi18n';

type BarcodeGenerationProps = {
  dataObj?: ProductSettings;
  handleOnChange?: (value: unknown, key: string) => void;
  errors?: FormErrors;
};

const BarcodeGeneration = (_props: BarcodeGenerationProps) => {
  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Barcode Generation', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Select a unit for your store's product weight and dimensions.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Flex direction="column" gap={4}>
                <Flex direction="column" gap={2}>
                  <Label htmlFor="barcode-data-origin">
                    {__('Data origin', 'kirki-ecommerce')}
                  </Label>
                  <Select defaultValue="sku">
                    <SelectTrigger id="barcode-data-origin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sku">
                        {__('SKU', 'kirki-ecommerce')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Flex>
                <Flex direction="column" gap={2}>
                  <Label htmlFor="barcode-format">
                    {__('Format', 'kirki-ecommerce')}
                  </Label>
                  <Select defaultValue="sku">
                    <SelectTrigger id="barcode-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sku">
                        {__(
                          'Code 128 (recommended for SKU/internal use)',
                          'kirki-ecommerce',
                        )}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Flex>
                <Grid>
                  <Flex direction="column" gap={2}>
                    <Label htmlFor="barcode-width">
                      {__('Width', 'kirki-ecommerce')}
                    </Label>
                    <Input
                      id="barcode-width"
                      type="number"
                      placeholder={__('2.5', 'kirki-ecommerce')}
                    />
                  </Flex>

                  <Flex direction="column" gap={2}>
                    <Label htmlFor="barcode-height">
                      {__('Height', 'kirki-ecommerce')}
                    </Label>
                    <Input
                      id="barcode-height"
                      type="number"
                      placeholder={__('2.5', 'kirki-ecommerce')}
                    />
                  </Flex>
                </Grid>

                <CountrySelector
                  label={__('Country of origin', 'kirki-ecommerce')}
                  onChange={() => { }}
                />

                <Flex gap={2} align="center">
                  <Checkbox id="barcode-show-readable-text" />
                  <Label htmlFor="barcode-show-readable-text">
                    {__(
                      'Show human-readable text under barcode',
                      'kirki-ecommerce',
                    )}
                  </Label>
                </Flex>
                <Flex gap={2} align="center">
                  <Checkbox id="barcode-include-product-name" />
                  <Label htmlFor="barcode-include-product-name">
                    {__('Include product name above barcode', 'kirki-ecommerce')}
                  </Label>
                </Flex>
                <Flex gap={2} align="center">
                  <Checkbox id="barcode-include-country-of-origin" />
                  <Label htmlFor="barcode-include-country-of-origin">
                    {__('Include country of origin', 'kirki-ecommerce')}
                  </Label>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={styles.previewContent}>
              <span>
                <img
                  src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Screenshot-2025-07-24-at-2.29.50-PM-1.png"
                  alt={__('Barcode label preview', 'kirki-ecommerce')}
                />
              </span>
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.innerCard}>
            <CardContent cssOverride={cardStyles.innerContent}>
              <Flex>
                <Flex direction="column" gap={2}>
                  <Text weight="medium">{__(
                    'Generate barcodes for all products',
                    'kirki-ecommerce',
                  )}</Text>
                  <Text color="secondary">{__(
                    'Enable this option to let customers submit product reviews',
                    'kirki-ecommerce',
                  )}</Text>
                </Flex>
                <ActionGroup>
                  <Button variant="secondary">
                    {__('Generate', 'kirki-ecommerce')}
                  </Button>
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeGeneration;

const styles = defineStyles({
  previewContent: {
    height: '158px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.colors.border.default}`,
  },
});

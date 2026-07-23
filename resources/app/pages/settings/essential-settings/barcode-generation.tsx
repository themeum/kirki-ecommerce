import CountrySelector from '@/components/country-selector';
import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Text from '@/components/ui/text';
import type { FormErrors, SettingsSectionData } from '@/types';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type BarcodeGenerationProps = {
  dataObj?: SettingsSectionData;
  handleOnChange?: (value: unknown, key: string) => void;
  errors?: FormErrors;
};

const BarcodeGeneration = (_props: BarcodeGenerationProps) => {
  return (
    <div>
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Barcode Generation', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              "Select a unit for your store's product weight and dimensions.",
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerContent}>
              <Flex direction="column" gap={16}>
                <Flex direction="column" gap={8}>
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
                <Flex direction="column" gap={8}>
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
                  <Flex direction="column" gap={8}>
                    <Label htmlFor="barcode-width">
                      {__('Width', 'kirki-ecommerce')}
                    </Label>
                    <Input
                      id="barcode-width"
                      type="number"
                      placeholder={__('2.5', 'kirki-ecommerce')}
                    />
                  </Flex>

                  <Flex direction="column" gap={8}>
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
                  onChange={() => {}}
                />

                <Flex gap={8} style={{ alignItems: 'center' }}>
                  <Checkbox id="barcode-show-readable-text" />
                  <Label htmlFor="barcode-show-readable-text">
                    {__(
                      'Show human-readable text under barcode',
                      'kirki-ecommerce',
                    )}
                  </Label>
                </Flex>
                <Flex gap={8} style={{ alignItems: 'center' }}>
                  <Checkbox id="barcode-include-product-name" />
                  <Label htmlFor="barcode-include-product-name">
                    {__('Include product name above barcode', 'kirki-ecommerce')}
                  </Label>
                </Flex>
                <Flex gap={8} style={{ alignItems: 'center' }}>
                  <Checkbox id="barcode-include-country-of-origin" />
                  <Label htmlFor="barcode-include-country-of-origin">
                    {__('Include country of origin', 'kirki-ecommerce')}
                  </Label>
                </Flex>
              </Flex>
            </CardContent>
          </Card>
          <Card css={styles.innerDarkCard}>
            <CardContent css={styles.previewContent}>
              <span>
                <img src="https://kirki-ecommerce.test/wp-content/uploads/2025/10/Screenshot-2025-07-24-at-2.29.50-PM-1.png" />
              </span>
            </CardContent>
          </Card>
          <Card css={styles.innerCard}>
            <CardContent css={styles.innerContent}>
              <Flex>
                <Flex direction="column" gap={6}>
                  <Text
                    type="secondary"
                    header={__(
                      'Generate barcodes for all products',
                      'kirki-ecommerce',
                    )}
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

const styles = {
  largeCard: scoped({
    gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({
    paddingInline: theme.spacing['3xl'],
  }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  innerCard: scoped({
    borderRadius: theme.radius.lg,
    boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({
    padding: theme.spacing.lg,
  }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  previewContent: scoped({
    height: '158px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #E4E3E9',
  }),
};

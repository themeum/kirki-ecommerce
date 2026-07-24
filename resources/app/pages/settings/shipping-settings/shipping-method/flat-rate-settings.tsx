import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import { FormFieldRow } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import type { ShippingMethodData } from '@/pages/settings/shipping-settings/utils';

type FlatRateSettingsProps = {
  handleOnChange: (value: unknown, key: string) => void;
  dataObj: ShippingMethodData | Record<string, unknown>;
};

const FlatRateSettings = ({
  handleOnChange,
  dataObj,
}: FlatRateSettingsProps) => {
  return (
    <Flex direction="column" gap={16}>
      <Flex direction="column" gap={8}>
        <Label htmlFor="flat-rate-amount">{__('Rate', 'kirki-ecommerce')}</Label>
        <Input
          id="flat-rate-amount"
          value={(dataObj?.amount as string | number) || ''}
          type="number"
          placeholder={__('$0.00', 'kirki-ecommerce')}
          onChange={(e) => handleOnChange(e.target.value, 'amount')}
        />
      </Flex>

      <FormFieldRow>
        <Checkbox
          id="flat-rate-is-taxable"
          checked={(dataObj?.['is_taxable'] as boolean) || false}
          onCheckedChange={(checked) => handleOnChange(checked === true, 'is_taxable')}
        />
        <Label htmlFor="flat-rate-is-taxable">
          {__('This method is taxable', 'kirki-ecommerce')}
        </Label>
      </FormFieldRow>

      <Flex direction="column" gap={8}>
        <Label htmlFor="flat-rate-description">
          {__('Description', 'kirki-ecommerce')}
        </Label>
        <Textarea
          id="flat-rate-description"
          value={(dataObj?.description as string) || ''}
          placeholder={__('e.g., 3–5 business days', 'kirki-ecommerce')}
          onChange={(e) => handleOnChange(e.target.value, 'description')}
          css={styles.textarea}
        />
      </Flex>
    </Flex>
  );
};

FlatRateSettings.displayName = 'FlatRateSettings';

export default FlatRateSettings;

const styles = {
  textarea: scoped({
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    minHeight: '108px',
  }),
};

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
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

const CheckoutConf = () => {
  const options = [
    { label: __('Optional', 'kirki-ecommerce'), value: 'optional' },
    { label: __('Mandatory', 'kirki-ecommerce'), value: 'required' },
  ];

  return (
    <>
      <Card css={cardStyles.largeCard}>
        <CardHeader css={cardStyles.sectionHeader}>
          <CardTitle>{__('Checkout Configuration', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'Customize your checkout process to suit your preferences.',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={cardStyles.largeContent}>
          <Card css={[cardStyles.formCard, styles.formCardBorder]}>
            <CardContent>
              <SelectField
                name="checkout_configuration.address_line_validation"
                label={__('Address Line', 'kirki-ecommerce')}
                description={__('Select you address', 'kirki-ecommerce')}
                options={options}
              />
              <SelectField
                name="checkout_configuration.phone_number_validation"
                label={__('Phone Number', 'kirki-ecommerce')}
                description={__('Select you phone number', 'kirki-ecommerce')}
                options={options}
              />
              <SelectField
                name="checkout_configuration.company_name_validation"
                label={__('Company Name', 'kirki-ecommerce')}
                description={__('Select you company name', 'kirki-ecommerce')}
                options={options}
              />
              <SelectField
                name="checkout_configuration.company_id_validation"
                label={__('Company ID', 'kirki-ecommerce')}
                description={__('Select you company id', 'kirki-ecommerce')}
                options={options}
              />
              <SelectField
                name="checkout_configuration.vat_identification_number_validation"
                label={__('VAT Identification Number (VATIN)', 'kirki-ecommerce')}
                description={__('Select you VATIN', 'kirki-ecommerce')}
                options={options}
              />

              <Flex style={{ alignItems: 'center' }}>
                <Text
                  header={__('Apply Coupon Code', 'kirki-ecommerce')}
                  subHeader={__(
                    'Coupons can be applied from the cart and checkout pages.',
                    'kirki-ecommerce',
                  )}
                  type="secondary"
                />
                <ActionGroup>
                  <SwitchField name="checkout_configuration.has_apply_coupon_code" />
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
};

CheckoutConf.displayName = 'CheckoutConf';

export default CheckoutConf;

const styles = {
  formCardBorder: scoped({
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
  })
};

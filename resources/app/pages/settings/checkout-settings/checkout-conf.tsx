import SelectField from '@/components/form/select-field';
import SwitchField from '@/components/form/switch-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import ActionGroup from '@/molecules/action-group';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import { __ } from '@/wpi18n';

const CheckoutConf = () => {
  const options = [
    { label: __('Optional', 'kirki-ecommerce'), value: 'optional' },
    { label: __('Mandatory', 'kirki-ecommerce'), value: 'required' },
  ];

  return (
    <>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
        <Text
          type="primary"
          header={__('Checkout Configuration', 'kirki-ecommerce')}
          subHeader={__(
            'Customize your checkout process to suit your preferences.',
            'kirki-ecommerce',
          )}
          style={{ gap: 'var(--decom-spacing-f3)' }}
        />
        <Card
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
          style={{
            border: '1px solid var(--decom-border-border)',
            borderRadius: 'var(--decom-radius-rounded-lg)',
          }}
        >
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
        </Card>
      </Card>
    </>
  );
};

CheckoutConf.displayName = 'CheckoutConf';

export default CheckoutConf;

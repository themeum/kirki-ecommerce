import ActionGroup from '@/molecules/action-group';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import { Select } from '@/molecules/select';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import type { FormErrors, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

type CheckoutConfiguration = {
  address_line_validation?: string;
  phone_number_validation?: string;
  company_name_validation?: string;
  company_id_validation?: string;
  vat_identification_number_validation?: string;
  has_apply_coupon_code?: boolean;
};

type CheckoutConfProps = {
  dataObj: SettingsSectionData & {
    checkout_configuration?: CheckoutConfiguration;
  };
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

const CheckoutConf = (props: CheckoutConfProps) => {
  const optionsArray = [
    { title: __('Optional', 'kirki-ecommerce'), value: 'optional' },
    { title: __('Mandatory', 'kirki-ecommerce'), value: 'required' },
  ];
  const { dataObj, handleOnChange, errors } = props;
  return (
    <>
      <Card type="large">
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
          type="form"
          style={{
            border: '1px solid var(--decom-border-border)',
            borderRadius: 'var(--decom-radius-rounded-lg)',
          }}
        >
          <Select
            label={__('Address Line', 'kirki-ecommerce')}
            helpText={__('Select you address', 'kirki-ecommerce')}
            value={
              dataObj?.checkout_configuration?.address_line_validation || ''
            }
            onChange={(value) =>
              handleOnChange(value, 'address_line_validation')
            }
            optionsArray={optionsArray}
            error={
              errors['data.checkout_configuration.address_line_validation'] as
                | string
                | boolean
                | undefined
            }
          />
          <Select
            label={__('Phone Number', 'kirki-ecommerce')}
            helpText={__('Select you phone number', 'kirki-ecommerce')}
            value={dataObj?.checkout_configuration?.phone_number_validation}
            onChange={(value) =>
              handleOnChange(value, 'phone_number_validation')
            }
            optionsArray={optionsArray}
            error={
              errors['data.checkout_configuration.phone_number_validation'] as
                | string
                | boolean
                | undefined
            }
          />
          <Select
            label={__('Company Name', 'kirki-ecommerce')}
            helpText={__('Select you company name', 'kirki-ecommerce')}
            value={dataObj?.checkout_configuration?.company_name_validation}
            onChange={(value) =>
              handleOnChange(value, 'company_name_validation')
            }
            optionsArray={optionsArray}
            error={
              errors['data.checkout_configuration.company_name_validation'] as
                | string
                | boolean
                | undefined
            }
          />
          <Select
            label={__('Company ID', 'kirki-ecommerce')}
            helpText={__('Select you company id', 'kirki-ecommerce')}
            value={dataObj?.checkout_configuration?.company_id_validation}
            onChange={(value) => handleOnChange(value, 'company_id_validation')}
            optionsArray={optionsArray}
            error={
              errors['data.checkout_configuration.company_id_validation'] as
                | string
                | boolean
                | undefined
            }
          />
          <Select
            label={__('VAT Identification Number (VATIN)', 'kirki-ecommerce')}
            helpText={__('Select you VATIN', 'kirki-ecommerce')}
            value={
              dataObj?.checkout_configuration
                ?.vat_identification_number_validation
            }
            onChange={(value) =>
              handleOnChange(value, 'vat_identification_number_validation')
            }
            optionsArray={optionsArray}
            error={
              errors[
                'data.checkout_configuration.vat_identification_number_validation'
              ] as string | boolean | undefined
            }
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
              <ToggleButton
                value={
                  dataObj?.checkout_configuration
                    ?.has_apply_coupon_code as boolean
                }
                onChange={(value) =>
                  handleOnChange(value, 'has_apply_coupon_code')
                }
              />
            </ActionGroup>
          </Flex>
        </Card>
      </Card>
    </>
  );
};

export default CheckoutConf;

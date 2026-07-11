import ActionGroup from '@/molecules/action-group';
import Card from '@/molecules/card';
import RichText from '@/molecules/rich-text';
import Text from '@/molecules/text';
import ToggleButton from '@/molecules/toggle-button';
import type { FormErrors, SettingsSectionData } from '@/types';
import { __ } from '@/wpi18n';

type LegalInfoProps = {
  dataObj: SettingsSectionData & {
    is_terms_and_conditions_visible?: boolean;
    terms_and_conditions_content?: string;
    is_privacy_policy_visible?: boolean;
    privacy_policy_content?: string;
  };
  handleOnChange: (value: unknown, key: string) => void;
  errors: FormErrors;
};

const LegalInfo = (props: LegalInfoProps) => {
  const { dataObj, handleOnChange, errors } = props;
  return (
    <>
      <Card type="large">
        <Text
          type="primary"
          header={__('Legal Information', 'kirki-ecommerce')}
          subHeader={__(
            'show or hide your terms & conditions and privacy policy on the checkout page',
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
          <ActionGroup
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Text
              type="secondary"
              header={__('Show Terms and Conditions', 'kirki-ecommerce')}
            />
            <ToggleButton
              value={dataObj?.is_terms_and_conditions_visible as boolean}
              onChange={(value) =>
                handleOnChange(value, 'is_terms_and_conditions_visible')
              }
            />
          </ActionGroup>
          <RichText
            value={dataObj?.terms_and_conditions_content as string}
            onChange={(content) =>
              handleOnChange(content, 'terms_and_conditions_content')
            }
            placeholder={__(
              'Privacy & Policy . Terms & Conditions',
              'kirki-ecommerce',
            )}
            error={
              errors['data.terms_and_conditions_content'] as
                | string
                | boolean
                | undefined
            }
          />
        </Card>
        <Card
          type="form"
          style={{
            border: '1px solid var(--decom-border-border)',
            borderRadius: 'var(--decom-radius-rounded-lg)',
          }}
        >
          <ActionGroup
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Text
              type="secondary"
              header={__('Show Privacy Policy', 'kirki-ecommerce')}
            />
            <ToggleButton
              value={dataObj?.is_privacy_policy_visible as boolean}
              onChange={(value) =>
                handleOnChange(value, 'is_privacy_policy_visible')
              }
            />
          </ActionGroup>
          <RichText
            value={dataObj?.privacy_policy_content as string}
            onChange={(content) =>
              handleOnChange(content, 'privacy_policy_content')
            }
            placeholder={__(
              'Privacy & Policy . Terms & Conditions',
              'kirki-ecommerce',
            )}
            error={
              errors['data.privacy_policy_content'] as
                | string
                | boolean
                | undefined
            }
          />
        </Card>
      </Card>
    </>
  );
};

export default LegalInfo;

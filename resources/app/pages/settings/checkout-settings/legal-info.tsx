import RichTextField from '@/components/form/rich-text-field';
import SwitchField from '@/components/form/switch-field';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import ActionGroup from '@/components/ui/action-group';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

const LegalInfo = () => {
  return (
    <>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
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
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
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
            <SwitchField name="is_terms_and_conditions_visible" />
          </ActionGroup>
          <RichTextField
            name="terms_and_conditions_content"
            placeholder={__(
              'Privacy & Policy . Terms & Conditions',
              'kirki-ecommerce',
            )}
          />
        </Card>
        <Card
          className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-form`}
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
            <SwitchField name="is_privacy_policy_visible" />
          </ActionGroup>
          <RichTextField
            name="privacy_policy_content"
            placeholder={__(
              'Privacy & Policy . Terms & Conditions',
              'kirki-ecommerce',
            )}
          />
        </Card>
      </Card>
    </>
  );
};

LegalInfo.displayName = 'LegalInfo';

export default LegalInfo;

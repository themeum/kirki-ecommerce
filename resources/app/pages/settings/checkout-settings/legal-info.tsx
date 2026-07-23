import RichTextField from '@/components/form/rich-text-field';
import SwitchField from '@/components/form/switch-field';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ActionGroup from '@/components/ui/action-group';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const LegalInfo = () => {
  return (
    <>
      <Card css={styles.largeCard}>
        <CardHeader css={styles.sectionHeader}>
          <CardTitle>{__('Legal Information', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'show or hide your terms & conditions and privacy policy on the checkout page',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent css={styles.largeContent}>
          <Card css={[styles.formCard, styles.formCardBorder]}>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card css={[styles.formCard, styles.formCardBorder]}>
            <CardContent>
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
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </>
  );
};

LegalInfo.displayName = 'LegalInfo';

export default LegalInfo;

const styles = {
  largeCard: scoped({ gap: theme.spacing['3xl'] }),
  largeContent: scoped({ paddingInline: theme.spacing['3xl'] }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  formCardBorder: scoped({
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
  }),
};

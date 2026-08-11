import RichTextField from '@/components/form/rich-text-field';
import SwitchField from '@/components/form/switch-field';
import ActionGroup from '@/components/ui/action-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const LegalInfo = () => {
  return (
    <>
      <Card cssOverride={cardStyles.formCard}>
        <CardHeader cssOverride={cardStyles.sectionHeader}>
          <CardTitle>{__('Legal Information', 'kirki-ecommerce')}</CardTitle>
          <CardDescription>
            {__(
              'show or hide your terms & conditions and privacy policy on the checkout page',
              'kirki-ecommerce',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent cssOverride={cardStyles.largeContent}>
          <Flex direction="column" gap={4}>
            <Card cssOverride={mergeCss(cardStyles.formCard, styles.formCardBorder)}>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Flex align="center">
                    <Text weight="medium">{__('Show Terms and Conditions', 'kirki-ecommerce')}</Text>
                    <ActionGroup>
                      <SwitchField name="is_terms_and_conditions_visible" />
                    </ActionGroup>
                  </Flex>
                  <RichTextField
                    name="terms_and_conditions_content"
                    placeholder={__(
                      'Privacy & Policy . Terms & Conditions',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
              </CardContent>
            </Card>
            <Card cssOverride={mergeCss(cardStyles.formCard, styles.formCardBorder)}>
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Flex align="center">
                    <Text weight="medium">{__('Show Privacy Policy', 'kirki-ecommerce')}</Text>
                    <ActionGroup>
                      <SwitchField name="is_privacy_policy_visible" />
                    </ActionGroup>
                  </Flex>
                  <RichTextField
                    name="privacy_policy_content"
                    placeholder={__(
                      'Privacy & Policy . Terms & Conditions',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
              </CardContent>
            </Card>
          </Flex>
        </CardContent>
      </Card>
    </>
  );
};

LegalInfo.displayName = 'LegalInfo';

export default LegalInfo;

const styles = defineStyles({
  formCardBorder: {
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
  }
});

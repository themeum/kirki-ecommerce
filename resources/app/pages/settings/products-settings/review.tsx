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
import { __ } from '@/wpi18n';

export const Review = () => {
  return (
    <Card css={styles.largeCard}>
      <CardHeader css={styles.sectionHeader}>
        <CardTitle>{__('Reviews', 'kirki-ecommerce')}</CardTitle>
        <CardDescription>
          {__(
            'Configure how customers can submit reviews for your products',
            'kirki-ecommerce',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent css={styles.largeContent}>
        <Flex gap={12} direction="column">
          <Card css={styles.optionCard}>
            <CardContent>
              <Flex>
                <Flex direction="column" gap={6}>
                  <Text type="secondary" header={__('Reviews', 'kirki-ecommerce')} />
                  <Text
                    subHeader={__(
                      'Enable this option to let customers submit product reviews',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
                <ActionGroup>
                  <SwitchField name="is_enabled_reviews" />
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
          <Card css={styles.optionCard}>
            <CardContent>
              <Flex>
                <Flex direction="column" gap={6}>
                  <Text
                    type="secondary"
                    header={__('Star rating on reviews', 'kirki-ecommerce')}
                  />
                  <Text
                    subHeader={__(
                      'Allow customers to submit product reviews with star ratings.',
                      'kirki-ecommerce',
                    )}
                  />
                </Flex>
                <ActionGroup>
                  <SwitchField name="is_enabled_star_ratings" />
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
        </Flex>
      </CardContent>
    </Card>
  );
};

Review.displayName = 'Review';

const styles = {
  largeCard: scoped({ gap: theme.spacing['3xl'] }),
  largeContent: scoped({ paddingInline: theme.spacing['3xl'] }),
  sectionHeader: scoped({
    gap: theme.spacing.base,
    paddingInline: theme.spacing['3xl'],
  }),
  optionCard: scoped({
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  }),
};

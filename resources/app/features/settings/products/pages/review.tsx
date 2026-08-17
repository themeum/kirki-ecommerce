import SwitchField from '@/components/form/switch-field';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

export const Review = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader cssOverride={cardStyles.sectionHeader}>
        <CardTitle>{__('Reviews', 'kirki-ecommerce')} <Badge>Work in progress</Badge></CardTitle>
        <CardDescription>
          {__(
            'Configure how customers can submit reviews for your products',
            'kirki-ecommerce',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent cssOverride={cardStyles.largeContent}>
        <Flex gap={3} direction="column">
          <Card cssOverride={styles.optionCard}>
            <CardContent>
              <Flex>
                <Flex direction="column" gap={2}>
                  <Text weight="medium">{__('Reviews', 'kirki-ecommerce')}</Text>
                  <Text color="secondary">{__(
                    'Enable this option to let customers submit product reviews',
                    'kirki-ecommerce',
                  )}</Text>
                </Flex>
                <ActionGroup>
                  <SwitchField name="is_enabled_reviews" />
                </ActionGroup>
              </Flex>
            </CardContent>
          </Card>
          <Card cssOverride={styles.optionCard}>
            <CardContent>
              <Flex>
                <Flex direction="column" gap={2}>
                  <Text weight="medium">{__('Star rating on reviews', 'kirki-ecommerce')}</Text>
                  <Text color="secondary">{__(
                    'Allow customers to submit product reviews with star ratings.',
                    'kirki-ecommerce',
                  )}</Text>
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

const styles = defineStyles({
  optionCard: {
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
  },
});

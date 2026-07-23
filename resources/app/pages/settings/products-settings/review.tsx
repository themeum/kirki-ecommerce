import SwitchField from '@/components/form/switch-field';
import { Card } from '@/components/ui/card';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { __ } from '@/wpi18n';

export const Review = () => {
  return (
    <Card type="large">
      <Text
        header={__('Reviews', 'kirki-ecommerce')}
        subHeader={__(
          'Configure how customers can submit reviews for your products',
          'kirki-ecommerce',
        )}
        type="primary"
        style={{ gap: 'var(--decom-spacing-f3)' }}
      />
      <Flex gap={12} direction="column">
        <Card
          type="default"
          style={{
            borderRadius: 'var(--decom-radius-rounded-lg)',
            border: '1px solid var(--decom-border-border)',
          }}
        >
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
        </Card>
        <Card
          type="default"
          style={{
            borderRadius: 'var(--decom-radius-rounded-lg)',
            border: '1px solid var(--decom-border-border)',
          }}
        >
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
        </Card>
      </Flex>
    </Card>
  );
};

Review.displayName = 'Review';

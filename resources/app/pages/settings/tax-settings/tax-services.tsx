import { css } from '@emotion/react';
import { useState } from 'react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';
import { BoxClosedIcon, PlusIcon } from '@/icons';

const TaxServices = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <Card css={cardStyles.largeCard}>
        <CardContent css={cardStyles.largeContentPadded}>
          <Flex direction="column" gap={6}>
            <Flex style={{ alignItems: 'center' }}>
              <Flex direction="column" gap={8}>
                <Text weight="semibold">
                  {__('Tax Services', 'kirki-ecommerce')}
                </Text>
                <Text color="secondary">
                  {__(
                    'Connect your preferred sales tax service to Kirki store',
                    'kirki-ecommerce',
                  )}
                </Text>
              </Flex>
            </Flex>
          </Flex>

          <Flex direction="column">
            {[1, 2, 3].map((_item, index) => (
              <Card
                key={index}
                data-box-card
                css={css(cardStyles.innerCard, styles.boxCard, styles.boxCardBorderRadius)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <CardContent css={cardStyles.innerContent}>
                  <Flex style={{ alignItems: 'center', minHeight: '36px' }} gap={8}>
                    <Flex gap={8} style={{ alignItems: 'center' }}>
                      <BoxClosedIcon />
                      <Text variant="small" css={styles.mediumHeader}>Stripe Tax</Text>
                    </Flex>
                    {index === 1 ? (
                      <Badge text="Active" type="published" />
                    ) : (
                      <Text variant="small" color="subdued" css={styles.mutedText}>{__(
                          'Calculate and collect tax globally in your Kirki store',
                          'kirki-ecommerce',
                        )}</Text>
                    )}
                    <ActionGroup
                      css={css(
                        styles.hoverVisible,
                        hoveredIndex === index && styles.hoverVisibleActive,
                      )}
                    >
                      <Button variant="secondary">
                        <PlusIcon />
                        Setup
                      </Button>
                    </ActionGroup>
                  </Flex>
                </CardContent>
              </Card>
            ))}
          </Flex>
        </CardContent>
      </Card>
    </div>
  );
};

TaxServices.displayName = 'TaxServices';

export default TaxServices;

const styles = {
  boxCard: scoped({
    borderTop: 'none',
    borderRadius: theme.radius.none,
  }),
  boxCardBorderRadius: scoped({
    '&:first-of-type': {
      borderTop: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: `${theme.radius.md} ${theme.radius.md} ${theme.radius.none} ${theme.radius.none}`,
    },
    '&:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    },
  }),
  hoverVisible: css({
    visibility: 'hidden',
  }),
  hoverVisibleActive: css({
    visibility: 'visible',
  }),
  mutedText: scoped({
    color: theme.colors.text.subdued,
  }),
  mediumHeader: scoped({
    ...theme.typography.paragraph('medium'),
  }),
};

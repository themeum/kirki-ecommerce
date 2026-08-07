import { css } from '@emotion/react';
import { useState } from 'react';

import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { BoxClosedIcon, PlusIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const TaxServices = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <Card cssOverride={cardStyles.formCard}>
        <CardContent >
          <Flex direction="column" gap={2}>
            <Flex align="center">
              <Flex direction="column" gap={2}>
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
                cssOverride={mergeCss(cardStyles.innerCard, styles.boxCard, styles.boxCardBorderRadius)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <CardContent cssOverride={cardStyles.innerContent}>
                  <Flex gap={2} align="center" cssOverride={{ minHeight: '36px' }}>
                    <Flex gap={2} align="center">
                      <BoxClosedIcon />
                      <Text variant="small" cssOverride={styles.mediumHeader}>Stripe Tax</Text>
                    </Flex>
                    {index === 1 ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Text variant="small" color="subdued" cssOverride={styles.mutedText}>{__(
                        'Calculate and collect tax globally in your Kirki store',
                        'kirki-ecommerce',
                      )}</Text>
                    )}
                    <ActionGroup
                      cssOverride={mergeCss(styles.hoverVisible,
                        hoveredIndex === index && styles.hoverVisibleActive,)}
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

const styles = defineStyles({
  boxCard: {
    borderTop: 'none',
    borderRadius: theme.radius.none,
  },
  boxCardBorderRadius: {
    '&:first-of-type': {
      borderTop: `1px solid ${theme.colors.border.secondary}`,
      borderRadius: `${theme.radius.md} ${theme.radius.md} ${theme.radius.none} ${theme.radius.none}`,
    },
    '&:last-of-type': {
      borderRadius: `${theme.radius.none} ${theme.radius.none} ${theme.radius.md} ${theme.radius.md}`,
    },
  },
  hoverVisible: css({
    visibility: 'hidden',
  }),
  hoverVisibleActive: css({
    visibility: 'visible',
  }),
  mutedText: {
    color: theme.colors.text.subdued,
  },
  mediumHeader: {
    ...theme.typography.paragraph('medium'),
  },
});

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
import { __ } from '@/wpi18n';
import { BoxClosedIcon, PlusIcon } from '@/icons';

const TaxServices = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <Card css={styles.largeCard}>
        <CardContent css={styles.largeContent}>
          <Flex direction="column" gap={6}>
            <Flex style={{ alignItems: 'center' }}>
              <Text
                type="primary"
                header={__('Tax Services', 'kirki-ecommerce')}
                subHeader={__(
                  'Connect your preferred sales tax service to Kirki store',
                  'kirki-ecommerce',
                )}
                style={{ gap: '12px' }}
              />
            </Flex>
            <Text type="primary" />
          </Flex>

          <Flex direction="column">
            {[1, 2, 3].map((_item, index) => (
              <Card
                key={index}
                data-box-card
                css={css(styles.innerCard, styles.boxCard, styles.boxCardBorderRadius)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <CardContent css={styles.innerContent}>
                  <Flex style={{ alignItems: 'center', minHeight: '36px' }} gap={8}>
                    <Text
                      header="Stripe Tax"
                      type="xsm"
                      leftIcon={<BoxClosedIcon />}
                      style={{ fontWeight: '500' }}
                    />
                    {index === 1 ? (
                      <Badge text="Active" type="published" />
                    ) : (
                      <Text
                        subHeader={__(
                          'Calculate and collect tax globally in your Kirki store',
                          'kirki-ecommerce',
                        )}
                        type="xsm"
                        style={{ color: '#878593' }}
                      />
                    )}
                    <ActionGroup
                      css={css(
                        styles.hoverVisible,
                        hoveredIndex === index && styles.hoverVisibleActive,
                      )}
                    >
                      <Button variant="secondary" size="sm">
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
  largeCard: scoped({ gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({ padding: theme.spacing['3xl'] }),
  innerCard: scoped({ borderRadius: theme.radius.lg, boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({ padding: theme.spacing.lg }),
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
};

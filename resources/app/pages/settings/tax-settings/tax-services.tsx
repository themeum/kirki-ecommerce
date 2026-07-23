import { css } from '@emotion/react';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import { __ } from '@/wpi18n';
import { scoped } from '@/theme/mixins';
import { BoxClosedIcon, PlusIcon } from '@/icons';

const boxCardCss = scoped({
  borderTop: 'none',
  borderRadius: 'var(--decom-radius-rounded-none)',
});

const boxCardBorderRadiusCss = scoped({
  '&:first-of-type': {
    borderTop: '1px solid var(--decom-border-border-secondary)',
    borderRadius:
      'var(--decom-radius-rounded-md) var(--decom-radius-rounded-md) var(--decom-radius-rounded-none) var(--decom-radius-rounded-none)',
  },
  '&:last-of-type': {
    borderRadius:
      'var(--decom-radius-rounded-none) var(--decom-radius-rounded-none) var(--decom-radius-rounded-md) var(--decom-radius-rounded-md)',
  },
});

const hoverVisibleCss = css({
  visibility: 'hidden',
});

const hoverVisibleActiveCss = css({
  visibility: 'visible',
});

const TaxServices = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div>
      <Card type="large">
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
              type="inner"
              css={css(boxCardCss, boxCardBorderRadiusCss)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
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
                    hoverVisibleCss,
                    hoveredIndex === index && hoverVisibleActiveCss,
                  )}
                >
                  <Button variant="secondary" size="sm">
                    <PlusIcon />
                    Setup
                  </Button>
                </ActionGroup>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Card>
    </div>
  );
};

TaxServices.displayName = 'TaxServices';

export default TaxServices;

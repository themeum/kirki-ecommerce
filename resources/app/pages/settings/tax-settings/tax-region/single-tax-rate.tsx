import { css } from '@emotion/react';
import { useState } from 'react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import Flex from '@/components/ui/flex';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '@/pages/settings/utils';

type SingleTaxRateProps = {
  centralTaxValue: number | string;
  setCentralTaxValue: (value: number | string) => void;
};

export const SingleTaxRate = ({
  centralTaxValue,
  setCentralTaxValue,
}: SingleTaxRateProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleTaxRate = (value: number | string) => {
    setCentralTaxValue(value);
    setUnsavedDataStatus(true);
  };

  return (
    <div>
      <Card
        css={[cardStyles.innerDarkCard, styles.taxCard]}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent css={cardStyles.innerDarkContent}>
          <Text weight="medium">{__('Tax rates', 'kirki-ecommerce')}</Text>
          <div css={styles.taxCardContent}>
            <Text css={css(styles.rateDisplay, isHovered && styles.rateDisplayHidden)}>{centralTaxValue}</Text>

            <Flex
              gap={2}
              css={css(styles.editGroup, isHovered && styles.editGroupActive)}
            >
              <Input
                value={centralTaxValue}
                style={{ width: '72px' }}
                onChange={(e) => handleTaxRate(e.target.value)}
                onBlur={(e) => handleTaxRate(e.target.value)}
                type="number"
                min={0}
                max={100}
              />
            </Flex>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

SingleTaxRate.displayName = 'SingleTaxRate';

const styles = {
  taxCard: scoped({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.md,
    maxHeight: '44px',
    height: '44px',
    padding: theme.spacing[3],
  }),
  editGroup: css({
    display: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.2s',
  }),
  editGroupActive: css({
    display: 'flex',
    pointerEvents: 'auto',
  }),
  rateDisplay: scoped({
    transition: 'opacity 0.2s',
    display: 'flex',
  }),
  rateDisplayHidden: css({
    display: 'none',
  }),
  taxCardContent: scoped({
    display: 'flex',
    alignItems: 'center',
  })
};

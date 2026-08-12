import { css } from '@emotion/react';

import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { setUnsavedDataStatus } from '@/features/settings/lib/utils';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

type SingleTaxRateProps = {
  centralTaxValue: number | string;
  setCentralTaxValue: (value: number | string) => void;
};

export const SingleTaxRate = ({
  centralTaxValue,
  setCentralTaxValue,
}: SingleTaxRateProps) => {
  const handleTaxRate = (value: number | string) => {
    setCentralTaxValue(value);
    setUnsavedDataStatus(true);
  };

  return (
    <Card cssOverride={mergeCss(cardStyles.innerDarkCard)}>
      <CardContent cssOverride={{ width: '100%' }}>
        <Flex align="center" justify="space-between" cssOverride={{ height: '56px' }}>
          <Text variant="small" weight="medium">{__('Tax rates', 'kirki-ecommerce')}</Text>
          <Flex align="center" gap={2}>
            <Text variant="small" weight="medium">{sprintf(__('%d%', 'kirki-ecommerce'), centralTaxValue)}</Text>

            <Flex
              gap={2}
              cssOverride={mergeCss(styles.editGroup)}
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
          </Flex>
        </Flex>
      </CardContent>
    </Card>
  );
};

SingleTaxRate.displayName = 'SingleTaxRate';

const styles = defineStyles({
  editGroup: css({
    display: 'none',
    pointerEvents: 'none',
    transition: 'opacity 0.2s',
  }),
});

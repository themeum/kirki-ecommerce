import { css } from '@emotion/react';
import { useState } from 'react';

import { Card } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import Flex from '@/components/ui/flex';
import { __ } from '@/wpi18n';
import { scoped } from '@/theme/mixins';

import { setUnsavedDataStatus } from '@/pages/settings/utils';

type SingleTaxRateProps = {
  centralTaxValue: number | string;
  setCentralTaxValue: (value: number | string) => void;
};

const taxCardCss = scoped({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: 'var(--decom-radius-rounded-md)',
  maxHeight: '44px',
  height: '44px',
  padding: 'var(--decom-spacing-3)',
});

const editGroupCss = css({
  display: 'none',
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
});

const editGroupActiveCss = css({
  display: 'flex',
  pointerEvents: 'auto',
});

const rateDisplayCss = scoped({
  transition: 'opacity 0.2s',
  display: 'flex',
});

const rateDisplayHiddenCss = css({
  display: 'none',
});

const taxCardContentCss = scoped({
  display: 'flex',
  alignItems: 'center',
});

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
        type="innerDark"
        css={taxCardCss}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Text type="secondary" header={__('Tax rates', 'kirki-ecommerce')} />
        <div css={taxCardContentCss}>
          <Text
            header={centralTaxValue}
            css={css(rateDisplayCss, isHovered && rateDisplayHiddenCss)}
          />

          <Flex
            gap={8}
            css={css(editGroupCss, isHovered && editGroupActiveCss)}
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
      </Card>
    </div>
  );
};

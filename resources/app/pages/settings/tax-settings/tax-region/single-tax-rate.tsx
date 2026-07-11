import Card from '@/molecules/card';
import Text from '@/molecules/text';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

import { setUnsavedDataStatus } from '../../utils';

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
    <div>
      <Card type={'innerDark'} className={`${CLASS_PREFIX}-tax-card`}>
        <Text type="secondary" header={__('Tax rates', 'kirki-ecommerce')} />
        <div className={`${CLASS_PREFIX}-tax-card-content`}>
          <Text
            header={centralTaxValue}
            className={`${CLASS_PREFIX}-rate-display`}
          />

          <Flex gap={8} className={`${CLASS_PREFIX}-edit-group`}>
            <Input
              value={centralTaxValue}
              style={{ width: '72px' }}
              onChange={(value: number | string) => handleTaxRate(value)}
              onBlur={(value: number | string) => handleTaxRate(value)}
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

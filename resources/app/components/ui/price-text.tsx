import Flex from '@/components/ui/flex';
import Text, { type TextProps } from '@/components/ui/text';
import type { MoneyObject } from '@/schemas/shared/api';
import type { FlexAlign, FlexJustify } from '@/types/components/common';
import { isDefined } from '@/utils/object';

type PriceTextProps = {
  salePrice?: MoneyObject | null;
  regularPrice: MoneyObject;
  primaryTextProps?: TextProps;
  secondaryTextProps?: TextProps;
  justify?: FlexJustify;
  align?: FlexAlign;
};

const PriceText = ({
  salePrice,
  regularPrice,
  primaryTextProps,
  secondaryTextProps,
  justify = 'end',
  align = 'center',
}: PriceTextProps) => {
  const { variant: primaryVariant, ...restPrimaryProps } = primaryTextProps ?? {
    variant: 'small',
  };

  const {
    variant: secondaryVariant,
    color: secondaryColor,
    ...restSecondaryProps
  } = secondaryTextProps ?? { variant: 'tiny', color: 'secondary' };

  if (!isDefined(salePrice) || salePrice.raw === regularPrice.raw) {
    return (
      <Text variant={primaryVariant} {...restPrimaryProps}>
        {regularPrice.display}
      </Text>
    );
  }

  return (
    <Flex gap={2} align={align} justify={justify}>
      <Text variant={primaryVariant} {...restPrimaryProps}>
        {salePrice.display}
      </Text>
      <Text
        {...restSecondaryProps}
        variant={secondaryVariant}
        color={secondaryColor}
        cssOverride={{ textDecoration: 'line-through' }}
      >
        {regularPrice.display}
      </Text>
    </Flex>
  );
};

PriceText.displayName = 'PriceText';

export default PriceText;

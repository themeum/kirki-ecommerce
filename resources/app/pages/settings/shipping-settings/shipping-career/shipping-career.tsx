import Flex from '@/components/ui/flex';
import { BoxOpenIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { Card, CardContent } from '@/components/ui/card';
import { __ } from '@/wpi18n';

import { scoped, mergeCss, defineStyles } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';

import { theme } from '@/theme';

type ShippingCareerProps = Record<string, unknown>;

const ShippingCareer = (_props: ShippingCareerProps) => {
  const hasShippingCareers = false;
  return (
    <div>
      <Card cssOverride={cardStyles.largeCard} >
        <CardContent cssOverride={cardStyles.largeContentPadded}>

        <HeaderActionsCard
        header={__('Shipping Careers', 'kirki-ecommerce')}
        subHeader={__(
        'Used to create shipping rates for different product groups, like heavy items needing higher fees.',
        'kirki-ecommerce',
        )}
        buttonText={__('Add Career', 'kirki-ecommerce')}
        onAdd={() => console.log('')}
        />

        {!hasShippingCareers ? (
          <Card cssOverride={cardStyles.innerDarkCard}>
            <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyStateContent)}>
              <Flex direction="column" gap={2} align="center">
                <BoxOpenIcon />
                <span css={scoped(styles.mutedText)}>
                  {__(
                    'Added shipping profiles will appear here',
                    'kirki-ecommerce',
                  )}
                </span>
              </Flex>
            </CardContent>
          </Card>
        ) : (
          <GroupOptionCard />
        )}
        </CardContent>
      </Card>
    </div>
  );
};

ShippingCareer.displayName = 'ShippingCareer';

const styles = defineStyles({
  emptyStateContent: { padding: `${theme.spacing[9]} 0` },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});

export default ShippingCareer;

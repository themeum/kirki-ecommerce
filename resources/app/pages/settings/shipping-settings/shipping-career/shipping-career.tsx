import HeaderActionsCard from '@/components/header-actions-card';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { StackedItems } from '@/components/ui/stacked-items';
import { BoxOpenIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ShippingCareerProps = Record<string, unknown>;

const ShippingCareer = (_props: ShippingCareerProps) => {
  const hasShippingCareers = false;
  return (
    <div>
      <Card cssOverride={cardStyles.formCard} >
        <CardContent >

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
            <StackedItems />
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

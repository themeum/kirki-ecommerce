import Flex from '@/components/ui/flex';
import { BoxOpenIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { __ } from '@/wpi18n';

import { scoped } from '@/theme/mixins';
import { cardStyles } from '@/theme/card-styles';

type ShippingCareerProps = Record<string, unknown>;

const ShippingCareer = (_props: ShippingCareerProps) => {
  const hasShippingCareers = false;
  return (
    <div>
      <Card css={cardStyles.largeCard} >
        <CardContent css={cardStyles.largeContentPadded}>

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
          <Card css={cardStyles.innerDarkCard}>
            <CardContent css={[cardStyles.innerDarkContent, styles.emptyStateContent]}>
              <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
                <BoxOpenIcon />
                <span style={{ color: '#878593' }}>
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

const styles = {
  emptyStateContent: scoped({ padding: '36px 0' })
};

export default ShippingCareer;

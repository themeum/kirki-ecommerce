import Flex from '@/components/ui/flex';
import { BoxOpenIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import { Card } from '@/components/ui/card';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

type ShippingCareerProps = Record<string, unknown>;

const ShippingCareer = (_props: ShippingCareerProps) => {
  const hasShippingCareers = false;
  return (
    <div>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
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
          <Card
            className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-inner-dark`}
            style={{ padding: '36px 0' }}
          >
            <Flex direction="column" gap={8} style={{ alignItems: 'center' }}>
              <BoxOpenIcon />
              <span style={{ color: '#878593' }}>
                {__(
                  'Added shipping profiles will appear here',
                  'kirki-ecommerce',
                )}
              </span>
            </Flex>
          </Card>
        ) : (
          <GroupOptionCard />
        )}
      </Card>
    </div>
  );
};

ShippingCareer.displayName = 'ShippingCareer';

export default ShippingCareer;

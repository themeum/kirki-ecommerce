import Flex from '@/components/ui/flex';
import { BoxOpenIcon } from '@/icons';
import HeaderActionsCard from '@/components/header-actions-card';
import GroupOptionCard from '@/components/group-option-card';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type ShippingCareerProps = Record<string, unknown>;

const ShippingCareer = (_props: ShippingCareerProps) => {
  const hasShippingCareers = false;
  return (
    <div>
      <Card css={styles.largeCard} >
        <CardContent css={styles.largeContent}>

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
          <Card css={styles.innerDarkCard}>
            <CardContent css={[styles.innerDarkContent, styles.emptyStateContent]}>
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
  formCard: scoped({ rowGap: theme.spacing['2xl'] }),
  largeCard: scoped({ gap: theme.spacing['3xl'],
    padding: theme.spacing.none,
  }),
  largeContent: scoped({ padding: theme.spacing['3xl'] }),
  innerCard: scoped({ borderRadius: theme.radius.lg, boxShadow: 'none',
    padding: theme.spacing.none,
  }),
  innerContent: scoped({ padding: theme.spacing.lg }),
  innerDarkCard: scoped({
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surfaceSecondary,
    border: 'none',
    padding: theme.spacing.none,
  }),
  innerDarkContent: scoped({ padding: theme.spacing.lg }),
  emptyStateContent: scoped({ padding: '36px 0' }),
  darkCard: scoped({ backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
  lightCard: scoped({ borderRadius: theme.radius.md,
    padding: theme.spacing.none,
  }),
  shadowCard: scoped({
    boxShadow: '0px -1px 1px 0.5px #0000001a inset',
    border: 'none',
  }),
  tartiaryCard: scoped({
    backgroundColor: theme.colors.background.surfaceSecondary,
    padding: theme.spacing.none,
  }),
};

export default ShippingCareer;

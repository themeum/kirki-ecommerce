import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Text from '@/components/ui/text';
import Grid from '@/components/ui/grid';
import { ShippoIcon, EasyShipIcon } from '@/icons';
import { __ } from '@/wpi18n';

import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

const ShippingSolution = () => {
  return (
    <>
      <Card css={styles.largeCard} >
        <CardContent css={styles.largeContent}>

        <Text
        type="primary"
        header={__('Shipping Solution', 'kirki-ecommerce')}
        subHeader="Used to create shipping rates for different product groups, like heavy items needing higher fees."
        />

        <Grid>
        <Button
        variant="outline"
        style={{ width: '100%', padding: '20px 0' }}
        >
        <ShippoIcon />
        </Button>
        <Button
        variant="outline"
        style={{ width: '100%', padding: '20px 0' }}
        >
        <EasyShipIcon />
        </Button>
        </Grid>
        </CardContent>
      </Card>
    </>
  );
};

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

export default ShippingSolution;

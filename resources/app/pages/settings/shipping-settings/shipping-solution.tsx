import Button from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import Text from '@/components/ui/text';
import Grid from '@/components/ui/grid';
import { ShippoIcon, EasyShipIcon } from '@/icons';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { cardStyles } from '@/theme/card-styles';

const ShippingSolution = () => {
  return (
    <>
      <Card css={cardStyles.largeCard} >
        <CardContent css={cardStyles.largeContentPadded}>

        <Text
        type="primary"
        header={__('Shipping Solution', 'kirki-ecommerce')}
        subHeader="Used to create shipping rates for different product groups, like heavy items needing higher fees."
        />

        <Grid>
        <Button
        variant="outline"
        css={styles.solutionButton}
        >
        <ShippoIcon />
        </Button>
        <Button
        variant="outline"
        css={styles.solutionButton}
        >
        <EasyShipIcon />
        </Button>
        </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default ShippingSolution;

const styles = {
  solutionButton: scoped({
    width: '100%',
    padding: `${theme.spacing['3xl']} 0`,
  }),
};

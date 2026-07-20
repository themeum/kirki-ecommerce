import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Text from '@/molecules/text';
import Grid from '@/molecules/grid';
import { CLASS_PREFIX } from '@/conf';
import { ShippoIcon, EasyShipIcon } from '@/icons';
import { __ } from '@/wpi18n';

const ShippingSolution = () => {
  return (
    <>
      <Card className={`${CLASS_PREFIX}-card ${CLASS_PREFIX}-card-large`}>
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
      </Card>
    </>
  );
};

export default ShippingSolution;

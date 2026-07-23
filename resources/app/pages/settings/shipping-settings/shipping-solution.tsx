import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Text from '@/components/ui/text';
import Grid from '@/components/ui/grid';
import { ShippoIcon, EasyShipIcon } from '@/icons';
import { __ } from '@/wpi18n';

const ShippingSolution = () => {
  return (
    <>
      <Card type="large">
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

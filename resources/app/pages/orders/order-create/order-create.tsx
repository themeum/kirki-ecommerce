import Button from "@/components/ui/button";
import Container from "@/components/ui/container";
import Grid from "@/components/ui/grid";
import Page from "@/components/ui/page";
import PageHeading from "@/components/ui/page-heading";
import { __ } from "@/wpi18n";

const OrderCreate = () => {
  return <Page>
    <PageHeading
      text={__('Create Order', 'kirki-ecommerce')}
      type="primary"
      actions={
        <>
          <Button variant="ghost">
            {__('Cancel', 'kirki-ecommerce')}
          </Button>
          <Button variant="primary">
            {__('Save', 'kirki-ecommerce')}
          </Button>
        </>
      }
      hasBack
      sticky
    />
    <Container>
      <Grid>
        
      </Grid>
    </Container>
  </Page>;
};

export default OrderCreate;
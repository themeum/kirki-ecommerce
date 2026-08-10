import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';

import Page from '@/components/ui/page';
import { NEW_ITEM_ID } from '@/conf';
import CouponTable from '@/pages/coupons/coupon-table/coupon-table';
import { __ } from '@/wpi18n';

const Coupons = () => {
  const navigate = useNavigate();
  return (
    <Page>
      <PageHeading
        text={__('Coupons', 'kirki-ecommerce')}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              navigate('/coupons/' + NEW_ITEM_ID);
            }}
          >
            {__('Create Coupon', 'kirki-ecommerce')}
          </Button>
        }
      />
      <Container>
        <CouponTable />
      </Container>
    </Page>
  );
};

export default Coupons;

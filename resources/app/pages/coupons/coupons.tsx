import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';

import Page from '@/components/ui/page';
import { NEW_ITEM_ID } from '@/conf';
import { useListParams } from '@/hooks';
import { endpoints } from '@/libs/endpoints';
import CouponTable from '@/pages/coupons/coupon-table/coupon-table';
import { useCouponsQuery } from '@/services/coupon';
import { CouponListFilter, couponListOptions } from '@/types/filters/coupon';
import { __ } from '@/wpi18n';

const Coupons = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams<CouponListFilter>(couponListOptions);

  const { data, isLoading } = useCouponsQuery(params);

  const handlePaginationChange = useCallback(
    (value: number) => {
      setParam('page', value);
    },
    [setParam],
  );

  return (
    <Page>
      <PageHeading
        text={__('Coupons', 'kirki-ecommerce')}
        actions={
          <Button
            variant="primary"
            onClick={() => {
              navigate(endpoints.COUPON(NEW_ITEM_ID));
            }}
          >
            {__('Create Coupon', 'kirki-ecommerce')}
          </Button>
        }
      />
      <Container>
        <CouponTable
          data={data}
          isLoading={isLoading}
          onPageChange={handlePaginationChange}
        />
      </Container>
    </Page>
  );
};

export default Coupons;

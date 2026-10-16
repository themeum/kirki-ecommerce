import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import CouponTable from '@/features/coupons/components/coupon-table/coupon-table';
import { useCouponsQuery } from '@/features/coupons/services/coupon';
import type { CouponListFilter } from '@/features/coupons/types';
import { couponListOptions } from '@/features/coupons/types';
import { useDataTableParams } from '@/hooks';
import { CouponEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Coupons = () => {
  const navigate = useNavigate();
  const { params, hasActiveFilters } = useDataTableParams<CouponListFilter>(couponListOptions);

  const { data, isFetching, isError, refetch } = useCouponsQuery(params);

  const hasRecord = !(!isFetching && !hasActiveFilters && data?.total === 0); // @todo: later will use isDefined(data) && isDefined(data.has_record) && data?.has_record

  return (
    <Page>
      <PageHeading
        text={__('Coupons', 'kirki-ecommerce')}
        actions={
          hasRecord && (
            <Button
              variant="primary"
              onClick={() => {
                void navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: NEW_ITEM_ID }));
              }}
            >
              {__('Create Coupon', 'kirki-ecommerce')}
            </Button>
          )
        }
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : !hasRecord ? (
          <NotFoundState
            icon={<CouponEmptyStateIcon />}
            text={__('Create your first coupon', 'kirki-ecommerce')}
            description={__(
              'A great offer can easily turn a first look into a lifelong customer.',
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  void navigate(
                    RouteConfig.Coupons.get('EditCoupon').buildLink({ id: NEW_ITEM_ID }),
                  );
                }}
              >
                {__('Create Coupon', 'kirki-ecommerce')}
              </Button>
            }
          />
        ) : (
          <CouponTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

export default Coupons;

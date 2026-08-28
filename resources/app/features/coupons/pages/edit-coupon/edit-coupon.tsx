import { zodResolver } from '@hookform/resolvers/zod';
import { CheckSquare, Tag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Page from '@/components/ui/page';
import PageHeading from '@/components/ui/page-heading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Text from '@/components/ui/text';
import { NEW_ITEM_ID } from '@/conf';
import { RouteConfig } from '@/config/route-config';
import { getCouponBadgeInfo } from '@/features/coupons/lib/coupon-badge';
import CouponPreview from '@/features/coupons/pages/edit-coupon/coupon-preview';
import ConditionsTab from '@/features/coupons/pages/edit-coupon/tabs/conditions-tab';
import DetailsTab from '@/features/coupons/pages/edit-coupon/tabs/details-tab';
import TargetingTab from '@/features/coupons/pages/edit-coupon/tabs/targeting-tab';
import {
  type CouponFormInput,
  type CouponFormPayload,
  CouponFormSchema,
} from '@/features/coupons/schemas/forms/coupon-form';
import {
  useCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from '@/features/coupons/services/coupon';
import { buildProductSelection } from '@/features/products';
import type { ErrorResponse } from '@/libs/api';
import { splitIsoDateTime } from '@/libs/date';
import { applyServerErrors } from '@/libs/form-errors';
import { getDefaults, pickFormValues } from '@/libs/zod';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const DETAILS_TAB_FIELDS: (keyof CouponFormInput)[] = [
  'method',
  'title',
  'code',
  'discount_type',
  'discount_target',
  'eligible_item_type',
  'products',
  'categories',
  'discount_value_type',
  'discount_amount',
  'start_date',
  'start_time',
  'has_end_datetime',
  'end_date',
  'end_time',
];

const TARGETING_TAB_FIELDS: (keyof CouponFormInput)[] = [
  'target_country_type',
  'target_countries',
  'first_time_buyer_only',
  'customer_include_eligibility',
  'include_customers',
  'customer_exclude_eligibility',
  'exclude_customers',
];

const CONDITIONS_TAB_FIELDS: (keyof CouponFormInput)[] = [
  'has_usage_limit',
  'usage_limit',
  'has_customer_limit',
  'customer_limit',
];

const tabOptions = [
  {
    index: 'detail',
    title: __('Details', 'kirki-ecommerce'),
    icon: <Tag size={16} />,
    fields: DETAILS_TAB_FIELDS,
    hasTabError: (errors: FieldErrors<CouponFormInput>) =>
      DETAILS_TAB_FIELDS.some((field) => Boolean(errors[field])),
  },
  {
    index: 'targeting',
    title: __('Targeting', 'kirki-ecommerce'),
    icon: <CheckSquare size={16} />,
    fields: TARGETING_TAB_FIELDS,
    hasTabError: (errors: FieldErrors<CouponFormInput>) =>
      TARGETING_TAB_FIELDS.some((field) => Boolean(errors[field])),
  },
  {
    index: 'conditions',
    title: __('Conditions', 'kirki-ecommerce'),
    icon: <CheckSquare size={16} />,
    fields: CONDITIONS_TAB_FIELDS,
    hasTabError: (errors: FieldErrors<CouponFormInput>) =>
      CONDITIONS_TAB_FIELDS.some((field) => Boolean(errors[field])),
  },
] as const;

const EditCoupon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === NEW_ITEM_ID;
  const [activeTab, setActiveTab] = useState<(typeof tabOptions)[number]['index']>('detail');
  const [couponId, setCouponId] = useState<number>();

  const { data: couponInfo } = useCouponQuery(id ?? '');
  const createMutation = useCreateCouponMutation();
  const updateMutation = useUpdateCouponMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CouponFormInput, unknown, CouponFormPayload>({
    resolver: zodResolver(CouponFormSchema),
    defaultValues: getDefaults(CouponFormSchema),
  });

  const { errors } = form.formState;

  useEffect(() => {
    if (!couponInfo) {
      return;
    }

    setCouponId(couponInfo.id);

    const start = splitIsoDateTime(couponInfo.start_datetime);
    const end = splitIsoDateTime(couponInfo.end_datetime);

    form.reset(
      pickFormValues(CouponFormSchema, couponInfo, {
        discount_amount: couponInfo.base_discount_amount,
        start_date: start.date,
        start_time: start.time,
        end_date: end.date,
        end_time: end.time,
        products: couponInfo.products.map(buildProductSelection),
        include_customers: couponInfo.customers,
        exclude_customers: couponInfo.excluded_customers,
      }),
    );
  }, [couponInfo, form]);

  const handleSubmit = async (payload: CouponFormPayload) => {
    try {
      if (couponId) {
        await updateMutation.mutateAsync({ id: couponId, data: payload });
      } else {
        const response = await createMutation.mutateAsync(payload);

        if (isDefined(response.data) && isDefined(response.data.id)) {
          void navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: response.data.id }), {
            replace: true,
          });
        }
      }
    } catch (error) {
      applyServerErrors(form, error as ErrorResponse);
    }
  };

  const handleBack = () => {
    void navigate(-1);
  };

  const couponBadgeInfo = useMemo(() => {
    if (isNew || !isDefined(couponInfo?.status)) {
      return null;
    }

    return getCouponBadgeInfo(couponInfo.status);
  }, [isNew, couponInfo?.status]);

  return (
    <Page>
      <Form {...form}>
        <PageHeading
          text={isNew ? __('New Coupon', 'kirki-ecommerce') : __('Edit Coupon', 'kirki-ecommerce')}
          type="primary"
          sticky
          actions={
            <>
              <Button variant="ghost" onClick={handleBack}>
                {__('Cancel', 'kirki-ecommerce')}
              </Button>
              <Button
                variant="primary"
                onClick={form.handleSubmit(handleSubmit)}
                loading={isSubmitting}
              >
                {isNew ? __('Create', 'kirki-ecommerce') : __('Save', 'kirki-ecommerce')}
              </Button>
            </>
          }
          hasBack
          onBack={handleBack}
        >
          {!isNew && isDefined(couponBadgeInfo) && (
            <Badge variant={couponBadgeInfo.variant}>{couponBadgeInfo.text}</Badge>
          )}
        </PageHeading>

        <Container>
          <Flex gap={4}>
            <Flex direction="column" gap={4} basis="70%" grow={1}>
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as (typeof tabOptions)[number]['index'])
                }
              >
                <TabsList cssOverride={styles.tabsList}>
                  {tabOptions.map((option, index) => {
                    const hasError = option.hasTabError(errors);
                    return (
                      <TabsTrigger
                        value={option.index}
                        cssOverride={{
                          ...styles.tab,
                          ...(hasError && activeTab !== option.index ? styles.tabError : {}),
                        }}
                        key={index}
                      >
                        {option.icon}
                        <Text variant="small" weight="medium">
                          {option.title}{' '}
                          {hasError && activeTab !== option.index && (
                            <span css={styles.tabErrorMark}>*</span>
                          )}
                        </Text>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {activeTab === 'detail' && <DetailsTab />}
              {activeTab === 'targeting' && <TargetingTab />}
              {activeTab === 'conditions' && <ConditionsTab />}
            </Flex>

            <div css={scoped(styles.sidebar)}>
              <CouponPreview />
            </div>
          </Flex>
        </Container>
      </Form>
    </Page>
  );
};

EditCoupon.displayName = 'EditCoupon';

export default EditCoupon;

const styles = defineStyles({
  tabsList: {
    backgroundColor: theme.colors.background.surface,
  },
  tab: {
    gap: theme.spacing[2],
    '&[data-state="active"]': {
      backgroundColor: theme.colors.background.fillSecondary,
      boxShadow: 'none',
    },
  },
  tabError: {
    border: '1px solid',
    borderColor: theme.colors.border.critical,
  },
  tabErrorMark: {
    color: theme.colors.text.critical,
  },
  sidebar: {
    flexBasis: '30%',
    position: 'sticky',
    top: '96px',
    alignSelf: 'flex-start',
  },
});
